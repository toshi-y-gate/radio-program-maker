import { useState, useEffect, useCallback } from "react"
import type { User, LoginRequest, RegisterRequest } from "@/types"
import * as authApi from "@/services/api/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("token")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = useCallback(async (request: LoginRequest) => {
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.login(request)
      localStorage.setItem("token", res.token)
      setUser(res.user)
    } catch (e) {
      const message = e instanceof Error ? e.message : "ログインに失敗しました"
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRegister = useCallback(async (request: RegisterRequest) => {
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.register(request)
      localStorage.setItem("token", res.token)
      setUser(res.user)
    } catch (e) {
      const message = e instanceof Error ? e.message : "登録に失敗しました"
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    setError(null)
    try {
      await authApi.logout()
    } finally {
      localStorage.removeItem("token")
      setUser(null)
    }
  }, [])

  return { user, loading, error, handleLogin, handleRegister, handleLogout }
}
