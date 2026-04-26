import { tirekClient } from "./client.js";

export const achievementsApi = {
  getStudentAchievements: (studentId: string) =>
    tirekClient.psychologist.achievements.getStudentAchievements(studentId),
};
