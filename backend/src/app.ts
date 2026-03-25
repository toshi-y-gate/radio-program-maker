import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { authMiddleware } from "./middleware/auth";
import { ensureDbConnection } from "./db";
import authRoutes from "./routes/auth";
import voiceRoutes from "./routes/voices";
import cacheRoutes from "./routes/cache";
import generateRoutes from "./routes/generate";
import historyRoutes from "./routes/history";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "リクエストが多すぎます。15分後に再試行してください。" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/health", async (_req, res) => {
  try {
    await ensureDbConnection(1);
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "ok", db: "disconnected" });
  }
});

// Debug: MiniMax TTS test endpoint
app.get("/debug/tts-test", async (_req, res) => {
  try {
    const { config } = await import("./config");
    const resp = await fetch("https://api.minimax.io/v1/t2a_v2", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.minimaxApiKey}` },
      body: JSON.stringify({
        model: "speech-2.8-hd", text: "テスト音声です。", stream: false,
        language_boost: "Japanese",
        voice_setting: { voice_id: "male-qn-qingse", speed: 1.0, vol: 1.0, pitch: 0, emotion: "neutral" },
        audio_setting: { format: "mp3", sample_rate: 32000 },
      }),
    });
    const data = await resp.json() as { base_resp?: { status_code: number }; data?: { audio?: string } };
    const audio = data.data?.audio || "";
    const hexBuf = Buffer.from(audio, "hex");
    const b64Buf = Buffer.from(audio, "base64");
    res.json({
      status: data.base_resp?.status_code,
      audioLen: audio.length,
      first40: audio.substring(0, 40),
      hexBufSize: hexBuf.length,
      b64BufSize: b64Buf.length,
      hexHead: hexBuf.slice(0, 4).toString("hex"),
      b64Head: b64Buf.slice(0, 4).toString("hex"),
    });
  } catch (e) {
    res.json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// Neon DB cold start対策: API呼び出し前にDB接続を保証
app.use("/api", async (_req, _res, next) => {
  try {
    await ensureDbConnection();
  } catch {
    // 接続失敗してもルートハンドラに委ねる
  }
  next();
});

app.use(
  "/output",
  express.static(path.resolve(__dirname, "../output"))
);

app.use(
  "/uploads",
  authMiddleware,
  express.static(path.resolve(__dirname, "../uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/api/voices", voiceRoutes);
app.use("/api/cache", cacheRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/history", historyRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "内部サーバーエラーが発生しました" });
  }
);

export default app;
