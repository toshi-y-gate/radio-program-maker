import { useState, useEffect, useCallback } from "react"
import type { CustomVoice, PresetVoice } from "@/types"
import * as voiceApi from "@/services/api/voice-clone"

export function useVoices() {
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([])
  const [presetVoices, setPresetVoices] = useState<PresetVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVoices = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [custom, preset] = await Promise.all([
        voiceApi.getCustomVoices(),
        voiceApi.getPresetVoices(),
      ])
      setCustomVoices(custom)
      setPresetVoices(preset)
    } catch (e) {
      const message = e instanceof Error ? e.message : "ボイスの取得に失敗しました"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVoices()
  }, [fetchVoices])

  const createVoice = useCallback(
    async (name: string, sampleFile: File) => {
      setError(null)
      try {
        await voiceApi.createCustomVoice({ name, sampleFile })
        await fetchVoices()
      } catch (e) {
        const message = e instanceof Error ? e.message : "ボイスの作成に失敗しました"
        setError(message)
        throw e
      }
    },
    [fetchVoices],
  )

  const deleteVoice = useCallback(
    async (id: string) => {
      setError(null)
      try {
        await voiceApi.deleteCustomVoice(id)
        await fetchVoices()
      } catch (e) {
        const message = e instanceof Error ? e.message : "ボイスの削除に失敗しました"
        setError(message)
        throw e
      }
    },
    [fetchVoices],
  )

  return { customVoices, presetVoices, loading, error, fetchVoices, createVoice, deleteVoice }
}
