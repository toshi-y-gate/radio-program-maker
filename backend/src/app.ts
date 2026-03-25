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

// Temporarily disabled for debugging
// app.use("/api/auth/login", authLimiter);
// app.use("/api/auth/register", authLimiter);

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
  const steps: string[] = [];
  try {
    steps.push("1:start");
    const { prisma } = await import("./db");
    const bcrypt = await import("bcryptjs");
    const jwt = await import("jsonwebtoken");
    const { config } = await import("./config");

    steps.push("2:imports");
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    steps.push("3:findUser:" + !!user);

    if (!user) { res.json({ steps, error: "user not found" }); return; }

    const valid = await bcrypt.default.compare(password, user.password);
    steps.push("4:bcrypt:" + valid);

    if (!valid) { res.json({ steps, error: "invalid password" }); return; }

    const token = jwt.default.sign({ userId: user.id }, config.jwtSecret, { expiresIn: "7d" });
    steps.push("5:token:" + token.substring(0, 10));

    const result = { user: { email: user.email, displayName: user.displayName }, token };
    steps.push("6:beforeJson");
    res.json({ steps, result });
    steps.push("7:afterJson");
  } catch (err) {
    res.json({
      steps,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 3) : undefined,
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
