import { Router, Request, Response } from "express";
import { registerSchema, loginSchema } from "../utils/validation";
import * as authService from "../services/auth.service";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const result = await authService.register(
      parsed.data.email,
      parsed.data.password,
      parsed.data.displayName
    );
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "登録に失敗しました";
    res.status(409).json({ error: message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const result = await authService.login(
      parsed.data.email,
      parsed.data.password
    );
    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "ログインに失敗しました";
    res.status(401).json({ error: message });
  }
});

router.post("/logout", authMiddleware, (_req: Request, res: Response) => {
  res.json({ message: "ログアウトしました" });
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.json(user);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "ユーザー情報の取得に失敗しました";
    res.status(404).json({ error: message });
  }
});

export default router;
