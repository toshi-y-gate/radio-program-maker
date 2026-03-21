import { config, validateConfig } from "./config";
import app from "./app";
import { prisma } from "./db";

validateConfig();

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
