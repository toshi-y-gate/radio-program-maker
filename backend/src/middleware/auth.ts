import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "認証が必要です" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "無効なトークンです" });
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId } as AuthPayload, config.jwtSecret, {
    expiresIn: "7d",
  });
}
