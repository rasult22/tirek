import { apiFetch } from "./client";
import type { StreakInfo } from "@tirek/shared";

export const streaksApi = {
  get: () => apiFetch<StreakInfo>("/student/streaks"),
};
