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

app.use(helmet());

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

app.use(
  "/output",
  authMiddleware,
  express.static(path.resolve(__dirname, "../output"))
);

// Temporary debug endpoint - REMOVE after diagnosis
app.get("/debug/login-test", async (_req, res) => {
  try {
    const { prisma } = await import("./db");
    const bcrypt = await import("bcryptjs");

    const user = await prisma.user.findUnique({ where: { email: "test@example.com" } });
    if (!user) {
      res.json({ step: "findUnique", result: "user not found" });
      return;
    }

    const valid = await bcrypt.default.compare("Test1234!", user.password);
    res.json({
      step: "complete",
      userFound: true,
      passwordValid: valid,
      hashPrefix: user.password.substring(0, 7),
      bcryptVersion: typeof bcrypt.default.compareSync,
    });
  } catch (err) {
    res.json({
      step: "error",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined,
    });
  }
});

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
    console.error("Unhandled error:", err.message, err.stack);
    res.status(500).json({ error: "内部サーバーエラーが発生しました" });
  }
);

export default app;
