import { useState, useCallback } from "react"
import type { HistoryItem } from "@/types"
import * as historyApi from "@/services/api/history"

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [params, setParams] = useState<{ search?: string; model?: string; sort?: "newest" | "oldest" }>({})

  const fetchHistory = useCallback(
    async (opts?: { page?: number; search?: string; model?: string; sort?: "newest" | "oldest" }) => {
      const currentPage = opts?.page ?? 1
      const currentParams = {
        search: opts?.search,
        model: opts?.model,
        sort: opts?.sort,
      }
      setError(null)
      setLoading(true)
      try {
        const res = await historyApi.getHistory({
          page: currentPage,
          limit: 10,
          ...currentParams,
        })
        if (currentPage === 1) {
          setItems(res.items)
        } else {
          setItems((prev) => [...prev, ...res.items])
        }
        setTotal(res.total)
        setHasMore(res.hasMore)
        setPage(currentPage)
        setParams(currentParams)
      } catch (e) {
        const message = e instanceof Error ? e.message : "履歴の取得に失敗しました"
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    await fetchHistory({ page: nextPage, ...params })
  }, [page, params, fetchHistory])

  const deleteItem = useCallback(
    async (id: string) => {
      setError(null)
      try {
        await historyApi.deleteHistoryItem(id)
        setItems((prev) => prev.filter((item) => item.id !== id))
        setTotal((prev) => prev - 1)
      } catch (e) {
        const message = e instanceof Error ? e.message : "履歴の削除に失敗しました"
        setError(message)
        throw e
      }
    },
    [],
  )

  return { items, total, hasMore, loading, error, fetchHistory, loadMore, deleteItem }
}
