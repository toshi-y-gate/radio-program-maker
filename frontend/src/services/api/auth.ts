import type { LoginRequest, RegisterRequest, AuthResponse, User } from "../../types"

// @API_INTEGRATION
export function login(_request: LoginRequest): Promise<AuthResponse> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export function register(_request: RegisterRequest): Promise<AuthResponse> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export function logout(): Promise<void> {
  throw new Error("API not implemented")
}

// @API_INTEGRATION
export function getCurrentUser(): Promise<User> {
  throw new Error("API not implemented")
}
