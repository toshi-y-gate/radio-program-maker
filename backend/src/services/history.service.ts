import { prisma } from "../db";

type HistoryItem = {
  id: string;
  timestamp: string;
  script: string;
  speakers: string[];
  model: string;
  filename: string;
  durationSec: number;
  settings: {
    speed: number;
    volume: number;
    pitch: number;
    emotion: string;
  };
};

export async function listHistory(
  userId: string,
  page: number,
  limit: number,
  search?: string,
  model?: string,
  sort: "newest" | "oldest" = "newest"
): Promise<{ items: HistoryItem[]; total: number; hasMore: boolean }> {
  const where: Record<string, unknown> = { userId };

  if (search) {
    where.script = { contains: search };
  }
  if (model) {
    where.model = model;
  }

  const [items, total] = await Promise.all([
    prisma.history.findMany({
      where,
      orderBy: { createdAt: sort === "newest" ? "desc" : "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.history.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      timestamp: item.createdAt.toISOString(),
      script: item.script,
      speakers: JSON.parse(item.speakers) as string[],
      model: item.model,
      filename: item.filename,
      durationSec: item.durationSec,
      settings: JSON.parse(item.settings) as {
        speed: number;
        volume: number;
        pitch: number;
        emotion: string;
      },
    })),
    total,
    hasMore: page * limit < total,
  };
}

export async function deleteHistory(
  userId: string,
  historyId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const item = await tx.history.findFirst({
      where: { id: historyId, userId },
    });
    if (!item) {
      throw new Error("履歴が見つかりません");
    }
    await tx.history.delete({ where: { id: historyId } });
  });
}
