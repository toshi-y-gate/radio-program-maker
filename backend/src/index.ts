import fs from "fs";
import path from "path";
import { config, validateConfig } from "./config";
import app from "./app";
import { prisma, ensureDbConnection } from "./db";

validateConfig();

// uploadsディレクトリを確保（Railway ephemeral filesystem対応）
const uploadsDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const server = app.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);
  try {
    await ensureDbConnection();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err instanceof Error ? err.message : err);
  }
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
