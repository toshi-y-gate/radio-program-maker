import type { GenerateRequest, GenerateResponse, VoicePreset } from "../../types"
import { API_PATHS } from "../../types"
import { get, post, postFormData } from "./client"

export function generateProgram(request: GenerateRequest, bgmFile?: File): Promise<GenerateResponse> {
  const formData = new FormData()
  formData.append("data", JSON.stringify(request))
  if (bgmFile) {
    formData.append("bgmFile", bgmFile)
  }
  return postFormData<GenerateResponse>(API_PATHS.GENERATE, formData)
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
