import { PrismaClient } from "@prisma/client";
import path from "path";

process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL = "file:" + path.resolve(__dirname, "../prisma/test.db");
process.env.MINIMAX_API_KEY = "test-api-key";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
