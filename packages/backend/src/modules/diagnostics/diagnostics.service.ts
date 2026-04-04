import { v4 as uuidv4 } from "uuid";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { diagnosticsRepository } from "./diagnostics.repository.js";

interface ScoringRule {
  min: number;
  max: number;
  severity: string;
  label?: string;
  labelRu?: string;
  labelKz?: string;
  message?: string;
  descriptionRu?: string;
  descriptionKz?: string;
}

interface ScoringRules {
  thresholds: ScoringRule[];
  maxScore?: number;
  reverseItems?: number[];
  maxOptionValue?: number;
}

export const diagnosticsService = {
  async getAvailableTests(userId: string) {
    const tests = await diagnosticsRepository.findAllTests();
    return tests.map((t) => ({
      id: t.id,
      slug: t.slug,
      nameRu: t.nameRu,
      nameKz: t.nameKz,
      description: t.description,
      questionCount: t.questionCount,
    }));
  },

  async getAssignedTests(
    userId: string,
    grade?: number | null,
    classLetter?: string | null,
  ) {
    const assignments =
      await diagnosticsRepository.findAssignmentsForStudent(
        userId,
        grade,
        classLetter,
      );

    const testsWithAssignment = await Promise.all(
      assignments.map(async (a) => {
        const test = await diagnosticsRepository.findTestById(a.testId);
        return {
          assignmentId: a.id,
          testId: a.testId,
          dueDate: a.dueDate,
          test: test
            ? {
                id: test.id,
                slug: test.slug,
                nameRu: test.nameRu,
                nameKz: test.nameKz,
                description: test.description,
                questionCount: test.questionCount,
              }
            : null,
        };
      }),
    );

    return testsWithAssignment;
  },

  async startSession(userId: string, testId: string) {
    // Try finding by ID first, then by slug (frontend sends slug)
    let test = await diagnosticsRepository.findTestById(testId);
    if (!test) {
      test = await diagnosticsRepository.findTestBySlug(testId);
    }
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    const session = await diagnosticsRepository.createSession({
      id: uuidv4(),
      userId,
      testId: test.id,
    });

    return {
      sessionId: session.id,
      testId: test.id,
      nameRu: test.nameRu,
      nameKz: test.nameKz,
      questions: test.questions,
      questionCount: test.questionCount,
    };
  },

  async submitAnswer(
    userId: string,
    sessionId: string,
    body: { questionIndex?: number; answer?: number },
  ) {
    const { questionIndex, answer } = body;

    if (questionIndex === undefined || questionIndex === null) {
      throw new ValidationError("questionIndex is required");
    }
    if (answer === undefined || answer === null) {
      throw new ValidationError("answer is required");
    }

    const session = await diagnosticsRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Session not found");
    }
    if (session.userId !== userId) {
      throw new ForbiddenError("Session does not belong to this user");
    }
    if (session.completedAt) {
      throw new ValidationError("Session is already completed");
    }

    // Get the test to compute score
    const test = await diagnosticsRepository.findTestById(session.testId);
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    const scoringRules = test.scoringRules as ScoringRules | null;
    let score = answer;

    // Handle reverse scoring (e.g., Rosenberg self-esteem scale)
    if (scoringRules?.reverseItems && scoringRules?.maxOptionValue !== undefined) {
      if (scoringRules.reverseItems.includes(questionIndex)) {
        score = scoringRules.maxOptionValue - answer;
      }
    }

    const saved = await diagnosticsRepository.createAnswer({
      sessionId,
      questionIndex,
      answer,
      score,
    });

    return saved;
  },

  async completeSession(userId: string, sessionId: string) {
    const session = await diagnosticsRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Session not found");
    }
    if (session.userId !== userId) {
      throw new ForbiddenError("Session does not belong to this user");
    }
    if (session.completedAt) {
      throw new ValidationError("Session is already completed");
    }

    const test = await diagnosticsRepository.findTestById(session.testId);
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    const answers = await diagnosticsRepository.findAnswersBySession(sessionId);
    const totalScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);

    const scoringRules = test.scoringRules as ScoringRules | null;
    const maxScore =
      scoringRules?.maxScore ?? test.questionCount * 4; // fallback

    // Determine severity from thresholds
    let severity = "minimal";
    let resultMessage: string | undefined;
    if (scoringRules?.thresholds) {
      for (const threshold of scoringRules.thresholds) {
        if (totalScore >= threshold.min && totalScore <= threshold.max) {
          severity = threshold.severity;
          resultMessage = threshold.descriptionRu ?? threshold.message ?? threshold.labelRu ?? threshold.label;
          break;
        }
      }
    }

    const completed = await diagnosticsRepository.completeSession(sessionId, {
      totalScore,
      maxScore,
      severity,
      completedAt: new Date(),
    });

    return {
      sessionId: completed!.id,
      totalScore,
      maxScore,
      severity,
      message: resultMessage ?? null,
    };
  },

  async getSessionResult(userId: string, sessionId: string) {
    const session = await diagnosticsRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Session not found");
    }
    if (session.userId !== userId) {
      throw new ForbiddenError("Session does not belong to this user");
    }

    const test = await diagnosticsRepository.findTestById(session.testId);
    const scoringRules = test?.scoringRules as ScoringRules | null;

    let resultMessage: string | undefined;
    if (session.totalScore !== null && scoringRules?.thresholds) {
      for (const threshold of scoringRules.thresholds) {
        if (
          session.totalScore >= threshold.min &&
          session.totalScore <= threshold.max
        ) {
          resultMessage = threshold.descriptionRu ?? threshold.message ?? threshold.labelRu ?? threshold.label;
          break;
        }
      }
    }

    return {
      sessionId: session.id,
      testId: session.testId,
      testName: test?.nameRu ?? null,
      totalScore: session.totalScore,
      maxScore: session.maxScore,
      severity: session.severity,
      message: resultMessage ?? null,
      completedAt: session.completedAt,
    };
  },

  async getHistory(userId: string, pagination: PaginationParams) {
    const [rows, total] = await Promise.all([
      diagnosticsRepository.findSessionsByUser(userId, pagination),
      diagnosticsRepository.countSessionsByUser(userId),
    ]);

    const data = rows.map((r) => ({
      sessionId: r.session.id,
      testId: r.test.id,
      testName: r.test.nameRu,
      totalScore: r.session.totalScore,
      maxScore: r.session.maxScore,
      severity: r.session.severity,
      completedAt: r.session.completedAt,
    }));

    return paginated(data, total, pagination);
  },

  async assignTest(
    psychologistId: string,
    body: {
      testId?: string;
      targetType?: string;
      targetGrade?: number;
      targetClassLetter?: string;
      targetStudentId?: string;
      dueDate?: string;
    },
  ) {
    if (!body.testId || !body.targetType) {
      throw new ValidationError("testId and targetType are required");
    }
    const test = await diagnosticsRepository.findTestById(body.testId);
    if (!test) throw new NotFoundError("Test not found");

    const { db } = await import("../../db/index.js");
    const { testAssignments } = await import("../../db/schema.js");
    const { v4: uuid } = await import("uuid");

    const assignment = await db
      .insert(testAssignments)
      .values({
        id: uuid(),
        testId: body.testId,
        assignedBy: psychologistId,
        targetType: body.targetType,
        targetGrade: body.targetGrade ?? null,
        targetClassLetter: body.targetClassLetter ?? null,
        targetStudentId: body.targetStudentId ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .returning();

    return assignment[0];
  },

  async getResultsForPsychologist(
    psychologistId: string,
    pagination: PaginationParams,
    filters?: { studentId?: string },
  ) {
    const [rows, total] = await Promise.all([
      diagnosticsRepository.findSessionsByPsychologist(psychologistId, pagination, filters?.studentId),
      diagnosticsRepository.countSessionsByPsychologist(psychologistId, filters?.studentId),
    ]);

    const data = rows.map((r) => ({
      sessionId: r.session.id,
      studentId: r.session.userId,
      testId: r.test.id,
      testName: r.test.nameRu,
      totalScore: r.session.totalScore,
      maxScore: r.session.maxScore,
      severity: r.session.severity,
      completedAt: r.session.completedAt,
    }));

    return paginated(data, total, pagination);
  },
};
