import { apiFetch } from "./client.js";
import type { AuthResponse } from "@tirek/shared";

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: { email: string; password: string; inviteCode: string; avatarId?: string }) =>
    apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  me: () => apiFetch<any>("/auth/me"),
  updateProfile: (data: Record<string, unknown>) =>
    apiFetch<any>("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
};
