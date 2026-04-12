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

// Debug: Script parsing test
app.post("/debug/parse-test", express.json(), (req, res) => {
  const script = req.body.script || "";
  const lines = script.split("\n").filter((l: string) => l.trim());
  const patterns = [/^\[(.+?)\]\s*(.+)$/,/^【(.+?)】\s*(.+)$/,/^(.+?):\s*(.+)$/,/^(.+?)：\s*(.+)$/];

  function splitLongText(text: string, maxLen = 500): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[。！？\n])/);
    let current = "";
    for (const s of sentences) {
      if (current.length + s.length > maxLen && current.length > 0) { chunks.push(current.trim()); current = ""; }
      current += s;
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  const result: { speaker: string; textLen: number; preview: string }[] = [];
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        for (const chunk of splitLongText(match[2].trim())) {
          result.push({ speaker: match[1].trim(), textLen: chunk.length, preview: chunk.substring(0, 30) });
        }
        break;
      }
    }
  }
  res.json({ totalLines: lines.length, totalChunks: result.length, scriptLen: script.length, chunks: result });
});

// Debug: Google Cloud TTS test endpoint
app.get("/debug/tts-test", async (_req, res) => {
  try {
    const { config } = await import("./config");
    const resp = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.googleCloudTtsApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: "テスト音声です。" },
          voice: { languageCode: "ja-JP", name: "ja-JP-Chirp3-HD-Achernar" },
          audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
        }),
      }
    );
    if (!resp.ok) {
      const err = await resp.text();
      res.json({ error: `Google Cloud TTS API error: ${resp.status} ${err}` });
      return;
    }
    const data = (await resp.json()) as { audioContent: string };
    const buf = Buffer.from(data.audioContent, "base64");
    res.json({ status: "ok", audioSize: buf.length });
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
