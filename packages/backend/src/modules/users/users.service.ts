import { NotFoundError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { usersRepository } from "./users.repository.js";
import { analyticsRepository } from "../analytics/analytics.repository.js";
import {
  calculateRiskStatus,
  toRiskSession,
  type TestSessionForRisk,
} from "../../lib/risk-status-calculator/risk-status-calculator.js";

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

  async detachStudent(studentId: string, psychologistId: string) {
    const deleted = await usersRepository.detachStudent(studentId, psychologistId);
    if (!deleted) {
      throw new NotFoundError("Student not found or not linked to this psychologist");
    }
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

    const riskSessions = testResults
      .map(toRiskSession)
      .filter((s): s is TestSessionForRisk => s !== null);
    const { status, reason } = calculateRiskStatus(riskSessions);

    return {
      student,
      status,
      reason,
      moodHistory: moodTrend,
      testResults,
    };
  },
};
