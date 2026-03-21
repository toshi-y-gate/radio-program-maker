import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import voiceRoutes from "./routes/voices";
import cacheRoutes from "./routes/cache";
import generateRoutes from "./routes/generate";
import historyRoutes from "./routes/history";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/output", express.static(path.resolve(__dirname, "../output")));

app.use("/api/auth", authRoutes);
app.use("/api/voices", voiceRoutes);
app.use("/api/cache", cacheRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/history", historyRoutes);

export default app;
