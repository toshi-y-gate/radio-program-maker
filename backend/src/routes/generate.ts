import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { generateSchema } from "../utils/validation";
import * as generateService from "../services/generate.service";

const router = Router();

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const result = await generateService.generateRadio(
      req.userId!,
      parsed.data.script,
      parsed.data.speakers,
      parsed.data.settings,
      parsed.data.bgm
    );
    res.json(result);
  } catch (err) {
    console.error("Generate error:", err instanceof Error ? err.message : err);
    const message =
      err instanceof Error ? err.message : "音声生成に失敗しました";
    res.status(500).json({ error: message });
  }
});

export default router;
