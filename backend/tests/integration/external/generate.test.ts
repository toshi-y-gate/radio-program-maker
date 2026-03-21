import { PrismaClient } from "@prisma/client";
import supertest from "supertest";
import path from "path";

process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL = "file:" + path.resolve(__dirname, "../../../prisma/test.db");
process.env.MINIMAX_API_KEY = "";

import app from "../../../src/app";

const prisma = new PrismaClient();
const request = supertest(app);

let authToken: string;

beforeAll(async () => {
  await prisma.$connect();
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();

  const res = await request.post("/api/auth/register").send({
    email: "generate-test@example.com",
    password: "12345678",
    displayName: "Generate Tester",
  });
  authToken = res.body.token;
});

afterAll(async () => {
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /api/generate", () => {
  const validPayload = {
    script: "[太郎] こんにちは\n[花子] こんにちは！",
    speakers: [
      { speaker: "太郎", voiceId: "male-qn-qingse" },
      { speaker: "花子", voiceId: "female-shaonv" },
    ],
    settings: {
      speed: 1.0,
      volume: 1.0,
      pitch: 0,
      emotion: "neutral",
      model: "speech-2.8-hd",
    },
  };

  it("should reject without auth", async () => {
    const res = await request.post("/api/generate").send(validPayload);
    expect(res.status).toBe(401);
  });

  it("should reject invalid payload", async () => {
    const res = await request
      .post("/api/generate")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ script: "" });

    expect(res.status).toBe(400);
  });

  it("should return error when MINIMAX_API_KEY is not configured", async () => {
    const res = await request
      .post("/api/generate")
      .set("Authorization", `Bearer ${authToken}`)
      .send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("MINIMAX_API_KEY");
  });
});
