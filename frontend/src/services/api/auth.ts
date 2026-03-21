import type { LoginRequest, RegisterRequest, AuthResponse, User } from "../../types"
import { API_PATHS } from "../../types"
import { get, post } from "./client"

export function login(request: LoginRequest): Promise<AuthResponse> {
  return post<AuthResponse>(API_PATHS.AUTH_LOGIN, request)
}

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return post<AuthResponse>(API_PATHS.AUTH_REGISTER, request)
}

export function logout(): Promise<void> {
  return post<void>(API_PATHS.AUTH_LOGOUT)
}

export function getCurrentUser(): Promise<User> {
  return get<User>(API_PATHS.AUTH_ME)
}
