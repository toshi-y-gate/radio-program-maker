import type {
  CreateVoiceRequest,
  CreateVoiceResponse,
  CustomVoice,
  PresetVoice,
} from "../../types"
import { API_PATHS } from "../../types"
import { get, post, del } from "./client"

export function createCustomVoice(request: CreateVoiceRequest): Promise<CreateVoiceResponse> {
  return post<CreateVoiceResponse>(API_PATHS.VOICES_CUSTOM, {
    name: request.name,
    sampleUrl: "",
  })
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
