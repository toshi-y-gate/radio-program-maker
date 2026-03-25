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
app.post("/debug/login-test", async (req, res) => {
  try {
    const { loginSchema } = await import("./utils/validation");
    const authService = await import("./services/auth.service");

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.json({ step: "validation", error: parsed.error.errors[0].message, body: req.body });
      return;
    }

    const result = await authService.login(parsed.data.email, parsed.data.password);
    res.json({ step: "complete", result });
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
