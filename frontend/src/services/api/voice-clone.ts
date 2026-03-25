import type {
  CreateVoiceRequest,
  CreateVoiceResponse,
  CustomVoice,
  PresetVoice,
} from "../../types"
import { API_PATHS } from "../../types"
import { get, del } from "./client"

const RAILWAY_API = "https://radio-program-maker-production.up.railway.app"

export async function createCustomVoice(request: CreateVoiceRequest): Promise<CreateVoiceResponse> {
  const formData = new FormData()
  formData.append("name", request.name)
  formData.append("sample", request.sampleFile)

  const token = localStorage.getItem("token")
  const headers: HeadersInit = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${RAILWAY_API}${API_PATHS.VOICES_CUSTOM}`, {
    method: "POST",
    headers,
    body: formData,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(body.error || "ボイスの作成に失敗しました")
  }
  return response.json()
}

export function getCustomVoices(): Promise<CustomVoice[]> {
  return get<{ preset: PresetVoice[]; custom: CustomVoice[] }>(API_PATHS.VOICES).then(
    (res) => res.custom,
  )
}

export function deleteCustomVoice(id: string): Promise<void> {
  return del<void>(API_PATHS.VOICES_CUSTOM_DELETE.replace(":id", id))
}

export function getPresetVoices(): Promise<PresetVoice[]> {
  return get<PresetVoice[]>(API_PATHS.VOICES_PRESET)
}
