import { PrismaClient } from "@prisma/client";
import supertest from "supertest";
import path from "path";

process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL = "file:" + path.resolve(__dirname, "../../../prisma/test.db");

import app from "../../../src/app";

const prisma = new PrismaClient();
const request = supertest(app);

let authToken: string;
let userId: string;

beforeAll(async () => {
  await prisma.$connect();
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();

  const res = await request.post("/api/auth/register").send({
    email: "history-test@example.com",
    password: "12345678",
    displayName: "History Tester",
  });
  authToken = res.body.token;

  const user = await prisma.user.findUnique({
    where: { email: "history-test@example.com" },
  });
  userId = user!.id;
});

afterAll(async () => {
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/history", () => {
  beforeEach(async () => {
    await prisma.history.deleteMany();

    for (let i = 0; i < 5; i++) {
      await prisma.history.create({
        data: {
          script: `[太郎] テスト${i}`,
          speakers: JSON.stringify(["太郎"]),
          model: "speech-2.8-hd",
          filename: `test${i}.mp3`,
          durationSec: 10 + i,
          settings: JSON.stringify({
            speed: 1.0,
            volume: 1.0,
            pitch: 0,
            emotion: "neutral",
          }),
          audioUrl: `/output/test${i}.mp3`,
          userId,
        },
      });
    }
  });

  it("should return paginated history", async () => {
    const res = await request
      .get("/api/history?page=1&limit=3")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.total).toBe(5);
    expect(res.body.hasMore).toBe(true);
  });

  it("should return second page", async () => {
    const res = await request
      .get("/api/history?page=2&limit=3")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.hasMore).toBe(false);
  });

  it("should filter by search", async () => {
    const res = await request
      .get("/api/history?search=テスト3")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("should reject without auth", async () => {
    const res = await request.get("/api/history");
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/history/:id", () => {
  it("should delete own history item", async () => {
    const item = await prisma.history.create({
      data: {
        script: "[太郎] 削除テスト",
        speakers: JSON.stringify(["太郎"]),
        model: "speech-2.8-hd",
        filename: "delete-test.mp3",
        durationSec: 5,
        settings: JSON.stringify({
          speed: 1.0,
          volume: 1.0,
          pitch: 0,
          emotion: "neutral",
        }),
        audioUrl: "/output/delete-test.mp3",
        userId,
      },
    });

    const res = await request
      .delete(`/api/history/${item.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  it("should return 404 for non-existent history", async () => {
    const res = await request
      .delete("/api/history/nonexistent")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});
