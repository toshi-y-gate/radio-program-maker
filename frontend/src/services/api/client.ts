export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }
  const token = localStorage.getItem("token")
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
      throw new ApiError(401, "セッションが切れました。再ログインしてください")
    }
    const body = await response.json().catch(() => ({ error: response.statusText }))
    throw new ApiError(response.status, body.error || body.message || response.statusText)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json()
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return handleResponse<T>(response)
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: getAuthHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

export async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem("token")
  const headers: HeadersInit = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  const response = await fetch(path, {
    method: "POST",
    headers,
    body: formData,
  })
  return handleResponse<T>(response)
}

export async function del<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return handleResponse<T>(response)
}
