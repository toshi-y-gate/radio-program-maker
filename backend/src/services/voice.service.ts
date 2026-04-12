import fs from "fs";
import path from "path";
import { execSync } from "child_process";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require("ffmpeg-static") as string;
import { prisma } from "../db";
import { config } from "../config";

// Google Cloud TTS Chirp 3 HD voices (ja-JP)
const PRESET_VOICES = [
  { id: "ja-JP-Chirp3-HD-Charon", name: "Charon（男性A）", language: "ja" as const, gender: "male" as const },
  { id: "ja-JP-Chirp3-HD-Enceladus", name: "Enceladus（男性B）", language: "ja" as const, gender: "male" as const },
  { id: "ja-JP-Chirp3-HD-Fenrir", name: "Fenrir（男性C）", language: "ja" as const, gender: "male" as const },
  { id: "ja-JP-Chirp3-HD-Puck", name: "Puck（男性D）", language: "ja" as const, gender: "male" as const },
  { id: "ja-JP-Chirp3-HD-Aoede", name: "Aoede（女性A）", language: "ja" as const, gender: "female" as const },
  { id: "ja-JP-Chirp3-HD-Kore", name: "Kore（女性B）", language: "ja" as const, gender: "female" as const },
  { id: "ja-JP-Chirp3-HD-Leda", name: "Leda（女性C）", language: "ja" as const, gender: "female" as const },
  { id: "ja-JP-Chirp3-HD-Zephyr", name: "Zephyr（女性D）", language: "ja" as const, gender: "female" as const },
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

function prepareAudioForClone(filePath: string): string {
  const dir = path.dirname(filePath);
  const outputPath = path.join(dir, `clone_${Date.now()}.mp3`);

  // Convert to MP3, max 2 minutes, mono, 128kbps (keeps file under 2MB)
  execSync(
    `"${ffmpegPath}" -i "${filePath}" -t 120 -ac 1 -ab 128k -ar 44100 -y "${outputPath}" 2>/dev/null`,
    { timeout: 60000 }
  );

  const stats = fs.statSync(outputPath);
  if (stats.size > 19 * 1024 * 1024) {
    // If still too large, reduce to 60 seconds
    const smallerPath = path.join(dir, `clone_small_${Date.now()}.mp3`);
    execSync(
      `"${ffmpegPath}" -i "${filePath}" -t 60 -ac 1 -ab 64k -ar 22050 -y "${smallerPath}" 2>/dev/null`,
      { timeout: 60000 }
    );
    fs.unlinkSync(outputPath);
    return smallerPath;
  }

  return outputPath;
}

async function registerVoiceWithElevenLabs(
  filePath: string,
  voiceName: string
): Promise<string> {
  const preparedPath = prepareAudioForClone(filePath);
  const fileBuffer = fs.readFileSync(preparedPath);
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append("name", voiceName);
  formData.append("files", blob, path.basename(preparedPath));

  const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: { "xi-api-key": config.elevenlabsApiKey },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    fs.unlinkSync(preparedPath);
    throw new Error(`ElevenLabs voice clone failed: ${err}`);
  }

  const data = (await response.json()) as { voice_id: string };
  fs.unlinkSync(preparedPath);
  return data.voice_id;
}

export async function createCustomVoice(
  userId: string,
  name: string,
  sampleUrl: string
) {
  const voice = await prisma.customVoice.create({
    data: {
      name,
      sampleUrl,
      status: "creating",
      userId,
    },
  });

  const uploadsDir = path.resolve(__dirname, "../../uploads");
  const filePath = path.join(uploadsDir, path.basename(sampleUrl));

  try {
    const elevenLabsVoiceId = await registerVoiceWithElevenLabs(filePath, name);
    await prisma.customVoice.update({
      where: { id: voice.id },
      data: { status: "available", sampleUrl: elevenLabsVoiceId },
    });
    return {
      id: voice.id,
      name: voice.name,
      createdAt: voice.createdAt.toISOString(),
      status: "available" as const,
      sampleUrl: elevenLabsVoiceId,
    };
  } catch (err) {
    console.error("Voice clone failed:", err instanceof Error ? err.message : err);
    await prisma.customVoice.update({
      where: { id: voice.id },
      data: { status: "failed" },
    });
    throw err;
  }
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
