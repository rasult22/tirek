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

  async getAtRiskStudents(psychologistId: string) {
    const rows = await usersRepository.findCompletedSessionsForPsychologistStudents(
      psychologistId,
    );

    const byStudent = new Map<
      string,
      { name: string; sessions: TestSessionForRisk[] }
    >();
    for (const r of rows) {
      const session = toRiskSession({
        id: r.sessionId,
        testSlug: r.testSlug,
        testName: r.testName,
        severity: r.severity,
        flaggedItems: r.flaggedItems,
        completedAt: r.completedAt,
      });
      if (!session) continue;
      const existing = byStudent.get(r.studentId);
      if (existing) {
        existing.sessions.push(session);
      } else {
        byStudent.set(r.studentId, {
          name: r.studentName,
          sessions: [session],
        });
      }
    }

    const result: {
      studentId: string;
      studentName: string;
      status: "attention" | "crisis";
      reason: ReturnType<typeof calculateRiskStatus>["reason"];
    }[] = [];
    for (const [studentId, { name, sessions }] of byStudent) {
      const { status, reason } = calculateRiskStatus(sessions);
      if (status === "normal") continue;
      result.push({ studentId, studentName: name, status, reason });
    }
    return { data: result };
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
