import type {
  CreateVoiceRequest,
  CreateVoiceResponse,
  CustomVoice,
  PresetVoice,
} from "../../types"

// @API_INTEGRATION
export function createCustomVoice(_request: CreateVoiceRequest): Promise<CreateVoiceResponse> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export function getCustomVoices(): Promise<CustomVoice[]> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export function deleteCustomVoice(_id: string): Promise<void> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export function getPresetVoices(): Promise<PresetVoice[]> {
  throw new Error("API not implemented")
}
