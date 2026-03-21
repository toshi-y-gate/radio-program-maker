import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { historyListSchema } from "../utils/validation";
import * as historyService from "../services/history.service";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const parsed = historyListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const result = await historyService.listHistory(
      req.userId!,
      parsed.data.page,
      parsed.data.limit,
      parsed.data.search,
      parsed.data.model,
      parsed.data.sort
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "履歴の取得に失敗しました";
    res.status(500).json({ error: message });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    await historyService.deleteHistory(req.userId!, req.params.id as string);
    res.json({ message: "削除しました" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "削除に失敗しました";
    res.status(404).json({ error: message });
  }
});

export default router;
