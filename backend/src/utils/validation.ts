import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上必要です"),
  displayName: z.string().min(1, "表示名は必須です").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードは必須です"),
});

export const createVoiceSchema = z.object({
  name: z.string().min(1, "音声名は必須です").max(100),
});

export const generateSchema = z.object({
  script: z.string().min(1, "スクリプトは必須です"),
  speakers: z.array(
    z.object({
      speaker: z.string().min(1),
      voiceId: z.string().min(1),
    })
  ).min(1).max(4),
  settings: z.object({
    speed: z.number().min(0.5).max(2.0),
    stability: z.number().min(0).max(1.0),
    similarityBoost: z.number().min(0).max(1.0),
    model: z.enum([
      "eleven_multilingual_v2", "eleven_turbo_v2_5",
    ]),
  }),
  bgm: z.object({
    insertMode: z.enum([
      "background", "intro", "outro", "intro_outro", "full",
    ]),
    volume: z.number().min(0).max(1),
    outroDuration: z.number().min(0).max(15).default(5),
  }).optional(),
});

export const historyListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  model: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});
