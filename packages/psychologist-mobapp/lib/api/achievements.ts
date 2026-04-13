import { apiFetch } from "./client";
import type { UserAchievementItem } from "@tirek/shared";

export const achievementsApi = {
  getStudentAchievements: (studentId: string) =>
    apiFetch<{
      achievements: UserAchievementItem[];
      earnedCount: number;
      totalCount: number;
    }>(`/psychologist/achievements/${studentId}`),
};
