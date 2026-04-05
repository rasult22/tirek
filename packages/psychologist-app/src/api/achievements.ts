import { apiFetch } from "./client.js";
import type { UserAchievementItem } from "@tirek/shared";

export const achievementsApi = {
  getStudentAchievements: (studentId: string) =>
    apiFetch<{
      achievements: UserAchievementItem[];
      earnedCount: number;
      totalCount: number;
    }>(`/psychologist/achievements/${studentId}`),
};
