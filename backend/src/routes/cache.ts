import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as cacheService from "../services/cache.service";

const router = Router();

router.get("/stats", authMiddleware, (_req: Request, res: Response) => {
  const stats = cacheService.getCacheStats();
  res.json(stats);
});

router.post("/clear", authMiddleware, (_req: Request, res: Response) => {
  const result = cacheService.clearCache();
  res.json(result);
});

export default router;
