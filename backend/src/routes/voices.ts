import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { createVoiceSchema } from "../utils/validation";
import * as voiceService from "../services/voice.service";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const result = await voiceService.getAllVoices(req.userId!);
  res.json(result);
});

router.get("/preset", (_req: Request, res: Response) => {
  res.json(voiceService.getPresetVoices());
});

router.post("/custom", authMiddleware, async (req: Request, res: Response) => {
  const parsed = createVoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const sampleUrl = req.body.sampleUrl || "";
  const voice = await voiceService.createCustomVoice(
    req.userId!,
    parsed.data.name,
    sampleUrl
  );
  res.status(201).json({ voice });
});

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
