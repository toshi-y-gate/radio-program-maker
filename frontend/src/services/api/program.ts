import type { GenerateRequest, GenerateResponse, VoicePreset } from "../../types"
import { API_PATHS } from "../../types"
import { get, post, postFormData } from "./client"

export async function generateProgram(request: GenerateRequest, bgmFile?: File): Promise<GenerateResponse> {
  // Step 1: Start generation job
  let jobResp: { jobId: string }
  if (bgmFile) {
    const formData = new FormData()
    formData.append("data", JSON.stringify(request))
    formData.append("bgmFile", bgmFile)
    jobResp = await postFormData<{ jobId: string }>(API_PATHS.GENERATE, formData)
  } else {
    jobResp = await post<{ jobId: string }>(API_PATHS.GENERATE, request)
  }

  // Step 2: Poll for completion
  const maxWait = 300000 // 5 minutes
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 3000))
    const status = await get<{ status: string; audioUrl?: string; durationSec?: number; speakers?: string[]; error?: string }>(
      `${API_PATHS.GENERATE}/status/${jobResp.jobId}`
    )
    if (status.status === "done") {
      return { audioUrl: status.audioUrl!, durationSec: status.durationSec!, speakers: status.speakers! }
    }
    if (status.status === "error") {
      throw new Error(status.error || "音声生成に失敗しました")
    }
  }
  throw new Error("生成がタイムアウトしました。再度お試しください。")
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
