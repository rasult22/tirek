import { apiFetch } from "./client";
import type { AuthResponse, User } from "@tirek/shared";

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => apiFetch<User>("/auth/me"),

  updateProfile: (data: Record<string, unknown>) =>
    apiFetch<User>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
