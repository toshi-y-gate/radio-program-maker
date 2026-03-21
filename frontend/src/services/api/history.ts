import { get, del } from "./client"
import { API_PATHS } from "../../types"
import type { HistoryListRequest, HistoryListResponse } from "../../types"

export async function getHistory(request: HistoryListRequest): Promise<HistoryListResponse> {
  const params = new URLSearchParams()
  params.set("page", String(request.page))
  params.set("limit", String(request.limit))
  if (request.search) {
    params.set("search", request.search)
  }
  if (request.model) {
    params.set("model", request.model)
  }
  if (request.sort) {
    params.set("sort", request.sort)
  }
  return get<HistoryListResponse>(`${API_PATHS.HISTORY}?${params.toString()}`)
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const path = API_PATHS.HISTORY_DELETE.replace(":id", id)
  return del<void>(path)
}
