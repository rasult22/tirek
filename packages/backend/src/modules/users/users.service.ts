import { NotFoundError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { usersRepository } from "./users.repository.js";
import { analyticsRepository } from "../analytics/analytics.repository.js";

export const usersService = {
  async getStudents(
    psychologistId: string,
    pagination: PaginationParams,
    filters?: { grade?: number; classLetter?: string },
  ) {
    const [students, total] = await Promise.all([
      usersRepository.findStudentsByPsychologist(psychologistId, pagination, filters),
      usersRepository.countStudentsByPsychologist(psychologistId, filters),
    ]);

    return paginated(students, total, pagination);
  },

  async getStudentDetail(studentId: string, psychologistId: string) {
    const student = await usersRepository.findStudentById(studentId, psychologistId);
    if (!student) {
      throw new NotFoundError("Student not found or not linked to this psychologist");
    }

    const [moodTrend, testResults] = await Promise.all([
      analyticsRepository.getStudentMoodTrend(studentId, 30),
      analyticsRepository.getStudentTestResults(studentId),
    ]);

    // Determine student status based on latest test severity and SOS
    let status: "normal" | "attention" | "crisis" = "normal";
    const latestSevere = testResults.find((r) => r.severity === "high");
    const latestModerate = testResults.find((r) => r.severity === "moderate");
    if (latestSevere) {
      status = "crisis";
    } else if (latestModerate) {
      status = "attention";
    }

    return {
      student,
      status,
      moodHistory: moodTrend,
      testResults,
    };
  },
};
