import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { config } from "../config";

const PRESET_VOICES = [
  { id: "male-qn-qingse", name: "青涩青年", language: "ja" as const, gender: "male" as const },
  { id: "male-qn-jingying", name: "精英青年", language: "ja" as const, gender: "male" as const },
  { id: "female-shaonv", name: "少女", language: "ja" as const, gender: "female" as const },
  { id: "female-yujie", name: "御姐", language: "ja" as const, gender: "female" as const },
  { id: "male-qn-qingse-en", name: "Young Male", language: "en" as const, gender: "male" as const },
  { id: "male-qn-jingying-en", name: "Elite Male", language: "en" as const, gender: "male" as const },
  { id: "female-shaonv-en", name: "Young Female", language: "en" as const, gender: "female" as const },
  { id: "female-yujie-en", name: "Mature Female", language: "en" as const, gender: "female" as const },
];

export function getPresetVoices() {
  return PRESET_VOICES;
}

export async function getAllVoices(userId: string) {
  const custom = await prisma.customVoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    preset: PRESET_VOICES,
    custom: custom.map((v) => ({
      id: v.id,
      name: v.name,
      createdAt: v.createdAt.toISOString(),
      status: v.status as "available" | "creating" | "failed",
      sampleUrl: v.sampleUrl,
    })),
  };
}

async function registerVoiceWithMinimax(
  filePath: string,
  voiceId: string
): Promise<void> {
  // Step 1: Upload file to MiniMax
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append("purpose", "voice_clone");
  formData.append("file", blob, fileName);

  const uploadResp = await fetch("https://api.minimax.io/v1/files/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.minimaxApiKey}` },
    body: formData,
  });

  if (!uploadResp.ok) {
    const err = await uploadResp.text();
    throw new Error(`MiniMax file upload failed: ${err}`);
  }

  const uploadData = (await uploadResp.json()) as {
    file?: { file_id?: string };
    base_resp?: { status_code: number; status_msg?: string };
  };
  const fileId = uploadData.file?.file_id;
  if (!fileId) {
    throw new Error(
      `MiniMax file upload returned no file_id: ${uploadData.base_resp?.status_msg || "unknown"}`
    );
  }

  // Step 2: Clone voice
  const cloneResp = await fetch("https://api.minimax.io/v1/voice_clone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.minimaxApiKey}`,
    },
    body: JSON.stringify({
      file_id: fileId,
      voice_id: voiceId,
      noise_reduction: true,
      need_volume_normalization: true,
    }),
  });

  if (!cloneResp.ok) {
    const err = await cloneResp.text();
    throw new Error(`MiniMax voice clone failed: ${err}`);
  }

  const cloneData = (await cloneResp.json()) as {
    base_resp?: { status_code: number; status_msg?: string };
  };
  if (cloneData.base_resp?.status_code !== 0) {
    throw new Error(
      `MiniMax voice clone error: ${cloneData.base_resp?.status_msg || "unknown"}`
    );
  }
}

export async function createCustomVoice(
  userId: string,
  name: string,
  sampleUrl: string
) {
  // Generate a MiniMax-compatible voice_id (alphanumeric, starts with letter, min 8 chars)
  const minimaxVoiceId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const voice = await prisma.customVoice.create({
    data: {
      name,
      sampleUrl,
      status: "creating",
      userId,
    },
  });

  // Register with MiniMax API in background
  const uploadsDir = path.resolve(__dirname, "../../uploads");
  const filePath = path.join(uploadsDir, path.basename(sampleUrl));

  try {
    await registerVoiceWithMinimax(filePath, minimaxVoiceId);
    await prisma.customVoice.update({
      where: { id: voice.id },
      data: { status: "available", sampleUrl: minimaxVoiceId },
    });
  } catch (err) {
    console.error("Voice clone failed:", err instanceof Error ? err.message : err);
    await prisma.customVoice.update({
      where: { id: voice.id },
      data: { status: "failed" },
    });
    throw err;
  }

  return {
    id: voice.id,
    name: voice.name,
    createdAt: voice.createdAt.toISOString(),
    status: "available" as const,
    sampleUrl: minimaxVoiceId,
  };
}

export async function deleteCustomVoice(userId: string, voiceId: string) {
  await prisma.$transaction(async (tx) => {
    const voice = await tx.customVoice.findFirst({
      where: { id: voiceId, userId },
    });
    if (!voice) {
      throw new Error("音声が見つかりません");
    }
    await tx.customVoice.delete({ where: { id: voiceId } });
  });
}
