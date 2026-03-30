export type User = {
  email: string
  displayName: string
}

export type ScriptLine = {
  speaker: string
  text: string
}

export type VoicePreset = {
  id: string
  name: string
}

export type HistoryItem = {
  id: string
  timestamp: string
  script: string
  speakers: string[]
  model: string
  filename: string
  durationSec: number
  settings: {
    speed: number
    volume: number
    pitch: number
    emotion: string
  }
}

export type TTSModel =
  | "speech-2.8-hd"
  | "speech-2.8-turbo"
  | "speech-2.6-hd"
  | "speech-2.6-turbo"

export type Emotion =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised"

export type BGMInsertMode =
  | "background"
  | "intro"
  | "outro"
  | "intro_outro"
  | "full"

export type AudioSettings = {
  speed: number
  volume: number
  pitch: number
  emotion: Emotion
  model: TTSModel
}

export type GenerateRequest = {
  script: string
  speakers: {
    speaker: string
    voiceId: string
  }[]
  settings: AudioSettings
  bgm?: {
    insertMode: BGMInsertMode
    volume: number
    outroDuration?: number
  }
}

export type GenerateResponse = {
  audioUrl: string
  durationSec: number
  speakers: string[]
}

export type CustomVoice = {
  id: string
  name: string
  createdAt: string
  status: "available" | "creating" | "failed"
  sampleUrl: string
}

export type PresetVoice = {
  id: string
  name: string
  language: "ja" | "en"
  gender: "male" | "female"
}

export type CreateVoiceRequest = {
  name: string
  sampleFile: File
}

export type CreateVoiceResponse = {
  voice: CustomVoice
}

export type HistoryListRequest = {
  page: number
  limit: number
  search?: string
  model?: string
  sort?: "newest" | "oldest"
}

export type HistoryListResponse = {
  items: HistoryItem[]
  total: number
  hasMore: boolean
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  displayName: string
}

export type AuthResponse = {
  user: User
  token: string
}

export const API_PATHS = {
  GENERATE: "/api/generate",
  VOICES: "/api/voices",
  CACHE_STATS: "/api/cache/stats",
  CACHE_CLEAR: "/api/cache/clear",
  VOICES_CUSTOM: "/api/voices/custom",
  VOICES_CUSTOM_DELETE: "/api/voices/custom/:id",
  VOICES_PRESET: "/api/voices/preset",
  HISTORY: "/api/history",
  HISTORY_DELETE: "/api/history/:id",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_ME: "/api/auth/me",
} as const
