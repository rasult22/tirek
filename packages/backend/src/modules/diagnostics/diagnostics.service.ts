import { v4 as uuidv4 } from "uuid";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { diagnosticsRepository } from "./diagnostics.repository.js";
import { productiveActionService } from "../productive-action/index.js";
import { aiReportService } from "./ai-report.singleton.js";
import { computeScore, type Severity } from "./test-scoring-engine.js";
import { crisisSignalsModule } from "../crisis-signals/module.js";

interface ScoringRule {
  min: number;
  max: number;
  severity: Severity;
  label?: string;
  labelRu?: string;
  labelKz?: string;
  message?: string;
  descriptionRu?: string;
  descriptionKz?: string;
}

interface FlaggedRule {
  questionIndex: number;
  minAnswer: number;
  reason: string;
}

interface ScoringRules {
  thresholds: ScoringRule[];
  maxScore?: number;
  reverseItems?: number[];
  maxOptionValue?: number;
  minOptionValue?: number;
  flaggedRules?: FlaggedRule[];
}

export interface StudentSuggestedAction {
  type: "exercise" | "journal" | "chat" | "hotline";
  textKey: string;
  deeplink: string;
}

export interface StudentCompletionResponse {
  completed: true;
  sessionId: string;
  requiresSupport: boolean;
  suggestedActions: StudentSuggestedAction[];
}

const NORMAL_ACTIONS: StudentSuggestedAction[] = [
  { type: "exercise", textKey: "completion.action.breathing", deeplink: "/exercises" },
  { type: "journal", textKey: "completion.action.journal", deeplink: "/journal/new" },
];

const SOFT_ESCALATION_ACTIONS: StudentSuggestedAction[] = [
  { type: "chat", textKey: "completion.action.chatPsychologist", deeplink: "/chat" },
  { type: "hotline", textKey: "completion.action.hotline", deeplink: "tel:150" },
  { type: "exercise", textKey: "completion.action.breathing", deeplink: "/exercises" },
];

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

  async completeSession(
    userId: string,
    sessionId: string,
  ): Promise<StudentCompletionResponse> {
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
    const scoringRules = test.scoringRules as ScoringRules | null;

    const fallbackMaxOption = 4;
    const computed = computeScore({
      answers: answers.map((a) => ({
        questionIndex: a.questionIndex,
        answer: a.answer,
      })),
      scoringRules: {
        thresholds: scoringRules?.thresholds ?? [],
        reverseItems: scoringRules?.reverseItems ?? [],
        maxScore: scoringRules?.maxScore ?? test.questionCount * fallbackMaxOption,
        maxOptionValue: scoringRules?.maxOptionValue ?? fallbackMaxOption,
        minOptionValue: scoringRules?.minOptionValue ?? 0,
      },
      questions: ((test.questions as Array<{ index?: number }>) ?? []).map(
        (q, i) => ({ index: q.index ?? i }),
      ),
      flaggedRules: scoringRules?.flaggedRules ?? [],
    });

    const completed = await diagnosticsRepository.completeSession(sessionId, {
      totalScore: computed.totalScore,
      maxScore: computed.maxScore,
      severity: computed.severity,
      completedAt: new Date(),
    });

    const requiresSupport =
      computed.severity === "severe" || computed.flaggedItems.length > 0;

    if (requiresSupport) {
      crisisSignalsModule
        .report({
          source: "test_session",
          userId,
          testSessionId: sessionId,
          testSlug: test.slug,
          testSeverity: "severe",
          flaggedItems: computed.flaggedItems,
        })
        .catch((e) => {
          console.error("[diagnostics] crisis routing failed", e);
        });
    }

    productiveActionService
      .recordProductiveAction(userId, "test")
      .catch(() => {});

    aiReportService.ensurePending(sessionId).catch((e) => {
      console.error("[diagnostics] failed to ensure AI report row", e);
    });
    void aiReportService.generateReport(sessionId).catch((e) => {
      console.error("[diagnostics] AI report generation failed", e);
    });

    return {
      completed: true,
      sessionId: completed!.id,
      requiresSupport,
      suggestedActions: requiresSupport ? SOFT_ESCALATION_ACTIONS : NORMAL_ACTIONS,
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
    const requiresSupport = session.severity === "severe";

    return {
      sessionId: session.id,
      testId: session.testId,
      testName: test?.nameRu ?? null,
      completedAt: session.completedAt,
      requiresSupport,
      suggestedActions: requiresSupport ? SOFT_ESCALATION_ACTIONS : NORMAL_ACTIONS,
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
