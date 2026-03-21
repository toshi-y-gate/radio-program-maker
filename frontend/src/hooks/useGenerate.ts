import { useState, useCallback, useRef } from "react"
import type { GenerateRequest } from "../types"
import { generateProgram } from "../services/api/program"

export function useGenerate() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const generate = useCallback(async (request: GenerateRequest) => {
    setIsGenerating(true)
    setProgress(0)
    setResultAudioUrl(null)
    setError(null)

    // Indeterminate progress simulation
    let p = 0
    intervalRef.current = setInterval(() => {
      p = Math.min(p + Math.random() * 8 + 2, 90)
      setProgress(Math.round(p))
    }, 500)

    try {
      const response = await generateProgram(request)
      setProgress(100)
      setResultAudioUrl(response.audioUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました")
    } finally {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsGenerating(false)
    }
  }, [])

  return { isGenerating, progress, resultAudioUrl, error, generate }
}
