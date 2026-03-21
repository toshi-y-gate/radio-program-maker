import type { GenerateRequest, GenerateResponse, VoicePreset } from "../../types"

// @API_INTEGRATION
export async function generateProgram(
  _request: GenerateRequest,
): Promise<GenerateResponse> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export async function getVoicePresets(): Promise<VoicePreset[]> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export async function getCacheStats(): Promise<{
  count: number
  sizeMB: number
}> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export async function clearCache(): Promise<void> {
  throw new Error("API not implemented")
}
