import { apiFetch } from "./client.js";
import type { Exercise, PaginatedResponse } from "@tirek/shared";

export const exercisesApi = {
  list: () => apiFetch<Exercise[]>("/student/exercises/"),

  history: () => apiFetch<PaginatedResponse<any>>("/student/exercises/history"),

  logCompletion: (exerciseId: string) =>
    apiFetch<{ ok: boolean }>(`/student/exercises/${exerciseId}/complete`, { method: "POST" }),
};
