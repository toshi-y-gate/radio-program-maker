import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth";
import { generateSchema } from "../utils/validation";
import * as generateService from "../services/generate.service";

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, "../../uploads"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `bgm_${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// In-memory job store
const jobs = new Map<
  string,
  { status: "processing" | "done" | "error"; result?: unknown; error?: string }
>();

const router = Router();

// Start generation (returns job ID immediately)
router.post(
  "/",
  authMiddleware,
  (req: Request, res: Response, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      upload.single("bgmFile")(req, res, next);
    } else {
      next();
    }
  },
  (req: Request, res: Response) => {
    let body = req.body;
    if (typeof body.data === "string") {
      try {
        body = JSON.parse(body.data);
      } catch {
        /* keep original */
      }
    }

    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const jobId = crypto.randomUUID();
    jobs.set(jobId, { status: "processing" });

    // Run generation in background
    const bgmFilePath = req.file ? req.file.path : undefined;
    generateService
      .generateRadio(
        req.userId!,
        parsed.data.script,
        parsed.data.speakers,
        parsed.data.settings,
        parsed.data.bgm,
        bgmFilePath
      )
      .then((result) => {
        jobs.set(jobId, { status: "done", result });
      })
      .catch((err) => {
        console.error(
          "Generate error:",
          err instanceof Error ? err.message : err
        );
        jobs.set(jobId, {
          status: "error",
          error: err instanceof Error ? err.message : "音声生成に失敗しました",
        });
      });

    // Return job ID immediately (no timeout)
    res.json({ jobId });
  }
);

// Poll job status
router.get("/status/:jobId", authMiddleware, (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId as string);
  if (!job) {
    res.status(404).json({ error: "ジョブが見つかりません" });
    return;
  }
  if (job.status === "done") {
    jobs.delete(req.params.jobId as string);
    res.json({ status: "done", ...(job.result as Record<string, unknown>) });
  } else if (job.status === "error") {
    jobs.delete(req.params.jobId as string);
    res.status(500).json({ status: "error", error: job.error });
  } else {
    res.json({ status: "processing" });
  }
});

export default router;
