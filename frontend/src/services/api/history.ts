import type { HistoryListRequest, HistoryListResponse } from "../../types"

// @API_INTEGRATION
export function getHistory(_request: HistoryListRequest): Promise<HistoryListResponse> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export function deleteHistoryItem(_id: string): Promise<void> {
  throw new Error("API not implemented")
}
