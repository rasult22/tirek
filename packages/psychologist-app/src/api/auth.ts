import { apiFetch } from "./client.js";
import type { AuthResponse, User } from "@tirek/shared";

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerPsychologist(data: {
  email: string;
  password: string;
  name: string;
  schoolId?: string;
}) {
  return apiFetch<AuthResponse>("/auth/register-psychologist", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return apiFetch<User>("/auth/me");
}

export function updateProfile(data: Record<string, unknown>) {
  return apiFetch<User>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
