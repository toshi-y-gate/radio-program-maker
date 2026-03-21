import supertest from "supertest";
import path from "path";
import fs from "fs";

process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL = "file:" + path.resolve(__dirname, "../../../prisma/test.db");

import { PrismaClient } from "@prisma/client";
import app from "../../../src/app";

const prisma = new PrismaClient();
const request = supertest(app);
const CACHE_DIR = path.resolve(__dirname, "../../../cache");

let authToken: string;

beforeAll(async () => {
  await prisma.$connect();
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();

  const res = await request.post("/api/auth/register").send({
    email: "cache-test@example.com",
    password: "12345678",
    displayName: "Cache Tester",
  });
  authToken = res.body.token;
});

afterAll(async () => {
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/cache/stats", () => {
  it("should return cache stats", async () => {
    const res = await request
      .get("/api/cache/stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe("number");
    expect(typeof res.body.sizeMB).toBe("number");
  });

  it("should reject without auth", async () => {
    const res = await request.get("/api/cache/stats");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/cache/clear", () => {
  beforeEach(() => {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(CACHE_DIR, "test-cache.mp3"), "data");
  });

  it("should clear cache", async () => {
    const res = await request
      .post("/api/cache/clear")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBeGreaterThanOrEqual(1);
  });

  it("should reject without auth", async () => {
    const res = await request.post("/api/cache/clear");
    expect(res.status).toBe(401);
  });
});
