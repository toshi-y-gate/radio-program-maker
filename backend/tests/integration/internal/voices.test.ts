import { PrismaClient } from "@prisma/client";
import supertest from "supertest";
import path from "path";

process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL = "file:" + path.resolve(__dirname, "../../../prisma/test.db");

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
    email: "voice-test@example.com",
    password: "12345678",
    displayName: "Voice Tester",
  });
  authToken = res.body.token;
});

afterAll(async () => {
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/voices/preset", () => {
  it("should return preset voices without auth", async () => {
    const res = await request.get("/api/voices/preset");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
  });
});

describe("GET /api/voices", () => {
  it("should return all voices for authenticated user", async () => {
    const res = await request
      .get("/api/voices")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preset).toHaveLength(8);
    expect(res.body.custom).toBeDefined();
  });

  it("should reject without auth", async () => {
    const res = await request.get("/api/voices");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/voices/custom", () => {
  it("should create a custom voice", async () => {
    const res = await request
      .post("/api/voices/custom")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "My Custom Voice", sampleUrl: "/samples/test.mp3" });

    expect(res.status).toBe(201);
    expect(res.body.voice.name).toBe("My Custom Voice");
    expect(res.body.voice.status).toBe("available");
    expect(res.body.voice.id).toBeDefined();
  });

  it("should reject without name", async () => {
    const res = await request
      .post("/api/voices/custom")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/voices/custom/:id", () => {
  it("should delete own custom voice", async () => {
    const createRes = await request
      .post("/api/voices/custom")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "To Delete", sampleUrl: "/samples/delete.mp3" });

    const voiceId = createRes.body.voice.id;
    const res = await request
      .delete(`/api/voices/custom/${voiceId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  it("should return 404 for non-existent voice", async () => {
    const res = await request
      .delete("/api/voices/custom/nonexistent")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});
