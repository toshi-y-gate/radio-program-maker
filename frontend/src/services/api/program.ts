import type { GenerateRequest, GenerateResponse, VoicePreset } from "../../types"
import { API_PATHS } from "../../types"
import { get, post } from "./client"

export function generateProgram(request: GenerateRequest): Promise<GenerateResponse> {
  return post<GenerateResponse>(API_PATHS.GENERATE, request)
}

export function getVoicePresets(): Promise<VoicePreset[]> {
  return get<VoicePreset[]>(API_PATHS.VOICES_PRESET)
}

export function getCacheStats(): Promise<{ count: number; sizeMB: number }> {
  return get<{ count: number; sizeMB: number }>(API_PATHS.CACHE_STATS)
}

export function clearCache(): Promise<void> {
  return post<void>(API_PATHS.CACHE_CLEAR)
}
