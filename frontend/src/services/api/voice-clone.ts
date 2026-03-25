import type {
  CreateVoiceRequest,
  CreateVoiceResponse,
  CustomVoice,
  PresetVoice,
} from "../../types"
import { API_PATHS } from "../../types"
import { get, del, postFormData } from "./client"

export function createCustomVoice(request: CreateVoiceRequest): Promise<CreateVoiceResponse> {
  const formData = new FormData()
  formData.append("name", request.name)
  formData.append("sample", request.sampleFile)
  return postFormData<CreateVoiceResponse>(API_PATHS.VOICES_CUSTOM, formData)
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
