import { tirekClient } from "./client";

export const achievementsApi = {
  getStudentAchievements: (studentId: string) =>
    tirekClient.psychologist.achievements.getStudentAchievements(studentId),
};
