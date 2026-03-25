import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth";
import * as voiceService from "../services/voice.service";

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, "../../uploads"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp3", ".wav", ".mp4", ".m4a"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await voiceService.getAllVoices(req.userId!);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "ボイス一覧の取得に失敗しました";
    res.status(500).json({ error: message });
  }
});

router.get("/preset", (_req: Request, res: Response) => {
  res.json(voiceService.getPresetVoices());
});

router.post(
  "/custom",
  authMiddleware,
  upload.single("sample"),
  async (req: Request, res: Response) => {
    const name = req.body.name;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "音声名は必須です" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "音声サンプルファイルは必須です" });
      return;
    }

    try {
      const sampleUrl = `/uploads/${req.file.filename}`;
      const voice = await voiceService.createCustomVoice(
        req.userId!,
        name.trim(),
        sampleUrl
      );
      res.status(201).json({ voice });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ボイスの作成に失敗しました";
      res.status(500).json({ error: message });
    }
  }
);

router.delete(
  "/custom/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      await voiceService.deleteCustomVoice(req.userId!, req.params.id as string);
      res.json({ message: "削除しました" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "削除に失敗しました";
      res.status(404).json({ error: message });
    }
  }
);

export default router;
