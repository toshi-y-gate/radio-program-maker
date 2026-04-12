import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  jwtSecret: process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL || "",
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || "",
  googleCloudTtsApiKey: process.env.GOOGLE_CLOUD_TTS_API_KEY || "",
  uploadsDir: path.resolve(__dirname, "../uploads"),
};

export function validateConfig(): void {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
}
