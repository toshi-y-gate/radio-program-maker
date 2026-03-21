import { useState, useEffect } from "react"
import type { VoicePreset } from "../types"
import { getVoicePresets } from "../services/api/program"

export function useVoicePresets() {
  const [presets, setPresets] = useState<VoicePreset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getVoicePresets()
      .then((data) => {
        if (!cancelled) setPresets(data)
      })
      .catch(() => {
        // Presets fetch failed silently - empty list will be shown
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { presets, loading }
}
