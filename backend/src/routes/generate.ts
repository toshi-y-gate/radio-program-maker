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

const router = Router();

router.post(
  "/",
  authMiddleware,
  (req: Request, res: Response, next) => {
    // Handle both JSON and FormData requests
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      upload.single("bgmFile")(req, res, next);
    } else {
      next();
    }
  },
  async (req: Request, res: Response) => {
    // Parse JSON fields from FormData or regular JSON body
    let body = req.body;
    if (typeof body.data === "string") {
      try { body = JSON.parse(body.data); } catch { /* keep original */ }
    }

    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    try {
      const bgmFilePath = req.file ? req.file.path : undefined;
      const result = await generateService.generateRadio(
        req.userId!,
        parsed.data.script,
        parsed.data.speakers,
        parsed.data.settings,
        parsed.data.bgm,
        bgmFilePath
      );
      res.json(result);
    } catch (err) {
      console.error("Generate error:", err instanceof Error ? err.message : err);
      const message =
        err instanceof Error ? err.message : "音声生成に失敗しました";
      res.status(500).json({ error: message });
    }
  }
);

export default router;
