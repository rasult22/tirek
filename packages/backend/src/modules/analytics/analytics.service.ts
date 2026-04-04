import { analyticsRepository } from "./analytics.repository.js";

export const analyticsService = {
  async getOverview(psychologistId: string) {
    return analyticsRepository.getOverview(psychologistId);
  },

  async getStudentReport(psychologistId: string, studentId: string) {
    const [moodTrend, testResults] = await Promise.all([
      analyticsRepository.getStudentMoodTrend(studentId, 30),
      analyticsRepository.getStudentTestResults(studentId),
    ]);

    return {
      studentId,
      moodTrend,
      testResults,
    };
  },

  async getClassReport(
    psychologistId: string,
    grade?: number,
    classLetter?: string,
  ) {
    return analyticsRepository.getClassStats(
      psychologistId,
      grade,
      classLetter,
    );
  },
};
