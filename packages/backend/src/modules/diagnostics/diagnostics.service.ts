import { v4 as uuidv4 } from "uuid";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { diagnosticsRepository } from "./diagnostics.repository.js";
import { achievementsService } from "../achievements/achievements.service.js";
import { aiReportService } from "./ai-report.service.js";

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
  minOptionValue?: number;
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

    const now = Date.now();

    const testsWithAssignment = await Promise.all(
      assignments.map(async (a) => {
        const test = await diagnosticsRepository.findTestById(a.testId);
        const latest = await diagnosticsRepository.findLatestSessionSinceForUser(
          userId,
          a.testId,
          a.createdAt,
        );

        let status: "not_started" | "in_progress" | "completed" = "not_started";
        let completedSessionId: string | null = null;
        if (latest) {
          if (latest.completedAt) {
            status = "completed";
            completedSessionId = latest.id;
          } else {
            status = "in_progress";
          }
        }

        const overdue =
          status !== "completed" &&
          a.dueDate !== null &&
          a.dueDate !== undefined &&
          new Date(a.dueDate).getTime() < now;

        return {
          assignmentId: a.id,
          testId: a.testId,
          dueDate: a.dueDate,
          status,
          completedSessionId,
          overdue,
          assignedAt: a.createdAt,
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
        const minVal = scoringRules.minOptionValue ?? 0;
        score = minVal + scoringRules.maxOptionValue - answer;
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

    achievementsService.checkAndAward(userId, { trigger: "test" }).catch(() => {});

    // Fire-and-forget: generate the AI report in the background.
    // Creating the pending row synchronously lets the psychologist UI poll
    // right away even before the LLM response comes back.
    aiReportService.ensurePending(sessionId).catch((e) => {
      console.error("[diagnostics] failed to ensure AI report row", e);
    });
    void aiReportService.generateReport(sessionId).catch((e) => {
      console.error("[diagnostics] AI report generation failed", e);
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
      testSlug?: string;
      target?: string;
      targetType?: string;
      targetGrade?: number;
      grade?: number;
      targetClassLetter?: string;
      classLetter?: string;
      targetStudentId?: string;
      studentId?: string;
      dueDate?: string;
    },
  ) {
    const targetType = body.targetType ?? body.target;
    if (!targetType) {
      throw new ValidationError("targetType (or target) is required");
    }

    // Resolve test: accept testId or testSlug
    if (!body.testId && !body.testSlug) {
      throw new ValidationError("testId or testSlug is required");
    }
    let test = body.testId
      ? await diagnosticsRepository.findTestById(body.testId)
      : null;
    if (!test && body.testSlug) {
      test = await diagnosticsRepository.findTestBySlug(body.testSlug);
    }
    if (!test) {
      throw new NotFoundError(`Test not found: ${body.testSlug ?? body.testId}`);
    }

    const { db } = await import("../../db/index.js");
    const { testAssignments } = await import("../../db/schema.js");
    const { v4: uuid } = await import("uuid");

    const assignment = await db
      .insert(testAssignments)
      .values({
        id: uuid(),
        testId: test.id,
        assignedBy: psychologistId,
        targetType,
        targetGrade: body.targetGrade ?? body.grade ?? null,
        targetClassLetter: body.targetClassLetter ?? body.classLetter ?? null,
        targetStudentId: body.targetStudentId ?? body.studentId ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .returning();

    return assignment[0];
  },

  async getAiReportForPsychologist(
    psychologistId: string,
    sessionId: string,
  ) {
    const access = await diagnosticsRepository.canPsychologistAccessSession(
      psychologistId,
      sessionId,
    );
    if (!access.found) throw new NotFoundError("Session not found");
    if (!access.linked) {
      throw new ForbiddenError("You are not linked to this student");
    }
    const existing = await aiReportService.findBySessionId(sessionId);
    if (!existing) {
      // Session exists but no report was ever generated — kick one off.
      await aiReportService.ensurePending(sessionId);
      void aiReportService.generateReport(sessionId).catch(() => {});
      return { status: "pending" as const };
    }
    return existing;
  },

  async regenerateAiReport(psychologistId: string, sessionId: string) {
    const access = await diagnosticsRepository.canPsychologistAccessSession(
      psychologistId,
      sessionId,
    );
    if (!access.found) throw new NotFoundError("Session not found");
    if (!access.linked) {
      throw new ForbiddenError("You are not linked to this student");
    }
    await aiReportService.resetToPending(sessionId);
    void aiReportService.generateReport(sessionId).catch(() => {});
    return { status: "pending" as const };
  },

  async getSessionAnswersForPsychologist(
    psychologistId: string,
    sessionId: string,
  ) {
    const access = await diagnosticsRepository.canPsychologistAccessSession(
      psychologistId,
      sessionId,
    );
    if (!access.found) throw new NotFoundError("Session not found");
    if (!access.linked) {
      throw new ForbiddenError("You are not linked to this student");
    }
    const session = await diagnosticsRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    const test = await diagnosticsRepository.findTestById(session.testId);
    const answers = await diagnosticsRepository.findAnswersBySession(sessionId);

    const questions = (test?.questions as Array<{
      index?: number;
      textRu?: string;
      textKz?: string;
      options?: Array<{ value: number; labelRu?: string; labelKz?: string }>;
    }>) ?? [];

    return {
      sessionId,
      testSlug: test?.slug ?? null,
      testName: test?.nameRu ?? null,
      items: answers.map((a) => {
        const q = questions.find(
          (x) => (x.index ?? questions.indexOf(x)) === a.questionIndex,
        );
        return {
          questionIndex: a.questionIndex,
          questionText: q?.textRu ?? null,
          answer: a.answer,
          answerLabel:
            q?.options?.find((o) => o.value === a.answer)?.labelRu ?? null,
          score: a.score,
        };
      }),
    };
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
      testSlug: r.test.slug,
      testName: r.test.nameRu,
      totalScore: r.session.totalScore,
      maxScore: r.session.maxScore,
      severity: r.session.severity,
      completedAt: r.session.completedAt,
      studentName: r.studentName,
      studentGrade: r.studentGrade,
      studentClass: r.studentClass,
    }));

    return paginated(data, total, pagination);
  },
};
