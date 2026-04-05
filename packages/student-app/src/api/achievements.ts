import { apiFetch } from "./client.js";
import type { UserAchievementItem, AchievementsSummary } from "@tirek/shared";

export const achievementsApi = {
  getAll: () =>
    apiFetch<{
      achievements: UserAchievementItem[];
      earnedCount: number;
      totalCount: number;
    }>("/student/achievements"),

  getSummary: () =>
    apiFetch<AchievementsSummary>("/student/achievements/summary"),
};
