import { prisma } from "../db";

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

export async function createCustomVoice(
  userId: string,
  name: string,
  sampleUrl: string
) {
  const voice = await prisma.customVoice.create({
    data: {
      name,
      sampleUrl,
      status: "available",
      userId,
    },
  });

  return {
    id: voice.id,
    name: voice.name,
    createdAt: voice.createdAt.toISOString(),
    status: voice.status as "available" | "creating" | "failed",
    sampleUrl: voice.sampleUrl,
  };
}

export async function deleteCustomVoice(userId: string, voiceId: string) {
  const voice = await prisma.customVoice.findFirst({
    where: { id: voiceId, userId },
  });
  if (!voice) {
    throw new Error("音声が見つかりません");
  }

  await prisma.customVoice.delete({ where: { id: voiceId } });
}
