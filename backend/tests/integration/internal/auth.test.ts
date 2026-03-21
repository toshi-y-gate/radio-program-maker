import { PrismaClient } from "@prisma/client";
import supertest from "supertest";
import path from "path";

process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL = "file:" + path.resolve(__dirname, "../../../prisma/test.db");

import app from "../../../src/app";

const prisma = new PrismaClient();
const request = supertest(app);

beforeAll(async () => {
  await prisma.$connect();
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.history.deleteMany();
  await prisma.customVoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it("should register a new user", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "test@example.com",
      password: "12345678",
      displayName: "テストユーザー",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.displayName).toBe("テストユーザー");
    expect(res.body.token).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    await request.post("/api/auth/register").send({
      email: "test@example.com",
      password: "12345678",
      displayName: "User1",
    });

    const res = await request.post("/api/auth/register").send({
      email: "test@example.com",
      password: "12345678",
      displayName: "User2",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it("should reject invalid email", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "invalid",
      password: "12345678",
      displayName: "Test",
    });

    expect(res.status).toBe(400);
  });

  it("should reject short password", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "test@example.com",
      password: "1234567",
      displayName: "Test",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await request.post("/api/auth/register").send({
      email: "login@example.com",
      password: "12345678",
      displayName: "Login User",
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  it("should login with correct credentials", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "login@example.com",
      password: "12345678",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("login@example.com");
    expect(res.body.token).toBeDefined();
  });

  it("should reject wrong password", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "login@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("should reject non-existent email", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "noone@example.com",
      password: "12345678",
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("should logout with valid token", async () => {
    const registerRes = await request.post("/api/auth/register").send({
      email: "logout@example.com",
      password: "12345678",
      displayName: "Logout User",
    });

    const res = await request
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${registerRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("ログアウトしました");
  });

  it("should reject without token", async () => {
    const res = await request.post("/api/auth/logout");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("should return current user info", async () => {
    const registerRes = await request.post("/api/auth/register").send({
      email: "me@example.com",
      password: "12345678",
      displayName: "Me User",
    });

    const res = await request
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registerRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me@example.com");
    expect(res.body.displayName).toBe("Me User");
  });

  it("should reject without token", async () => {
    const res = await request.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
