process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
process.env.MINIMAX_API_KEY = "test-api-key";
