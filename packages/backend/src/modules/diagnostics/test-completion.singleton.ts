import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../shared/errors.js";
import { env } from "../../config/env.js";
import { diagnosticsRepository } from "./diagnostics.repository.js";
import { aiReportService } from "./ai-report.singleton.js";
import { crisisSignalsModule } from "../crisis-signals/module.js";
import { productiveActionService } from "../productive-action/index.js";
import { computeScore, type Severity } from "./test-scoring-engine.js";
import {
  createTestCompletion,
  type CompletedSession,
} from "./test-completion.js";

interface ScoringRule {
  min: number;
  max: number;
  severity: Severity;
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

const FALLBACK_MAX_OPTION = 4;

async function performScoringAndComplete(input: {
  sessionId: string;
  userId: string;
}): Promise<CompletedSession> {
  const session = await diagnosticsRepository.findSessionById(input.sessionId);
  if (!session) throw new NotFoundError("Session not found");
  if (session.userId !== input.userId) {
    throw new ForbiddenError("Session does not belong to this user");
  }
  if (session.completedAt) {
    throw new ValidationError("Session is already completed");
  }

  const test = await diagnosticsRepository.findTestById(session.testId);
  if (!test) throw new NotFoundError("Test not found");

  const answers = await diagnosticsRepository.findAnswersBySession(
    input.sessionId,
  );
  const scoringRules = test.scoringRules as ScoringRules | null;

  const computed = computeScore({
    answers: answers.map((a) => ({
      questionIndex: a.questionIndex,
      answer: a.answer,
    })),
    scoringRules: {
      thresholds: scoringRules?.thresholds ?? [],
      reverseItems: scoringRules?.reverseItems ?? [],
      maxScore:
        scoringRules?.maxScore ?? test.questionCount * FALLBACK_MAX_OPTION,
      maxOptionValue: scoringRules?.maxOptionValue ?? FALLBACK_MAX_OPTION,
      minOptionValue: scoringRules?.minOptionValue ?? 0,
    },
    questions: ((test.questions as Array<{ index?: number }>) ?? []).map(
      (q, i) => ({ index: q.index ?? i }),
    ),
    flaggedRules: scoringRules?.flaggedRules ?? [],
  });

  const completedAt = new Date();
  const completed = await diagnosticsRepository.completeSession(
    input.sessionId,
    {
      totalScore: computed.totalScore,
      maxScore: computed.maxScore,
      severity: computed.severity,
      completedAt,
      flaggedItems: computed.flaggedItems,
    },
  );

  return {
    id: completed!.id,
    userId: session.userId,
    testId: session.testId,
    completedAt,
    totalScore: computed.totalScore,
    maxScore: computed.maxScore,
    severity: computed.severity,
    flaggedItems: computed.flaggedItems,
  };
}

export const testCompletionHandler = createTestCompletion({
  completeSession: performScoringAndComplete,
  findTestById: async (testId) => {
    const test = await diagnosticsRepository.findTestById(testId);
    return test ? { id: test.id, slug: test.slug } : null;
  },
  findAnswersBySession: async (sessionId) => {
    const answers = await diagnosticsRepository.findAnswersBySession(sessionId);
    return answers.map((a) => ({
      questionIndex: a.questionIndex,
      answer: a.answer,
    }));
  },
  reportCrisisSignal: async (signal) => {
    await crisisSignalsModule.report(signal);
  },
  ensureAiReportPending: async (sessionId) => {
    await aiReportService.ensurePending(sessionId);
  },
  scheduleAiReportGeneration: (sessionId) => {
    void aiReportService.generateReport(sessionId).catch((e) => {
      console.error("[diagnostics] AI report generation failed", e);
    });
  },
  isAiReportAvailable: () => Boolean(env.OPENAI_API_KEY),
  recordProductiveAction: async (userId) => {
    await productiveActionService.recordProductiveAction(userId, "test");
  },
  logger: {
    warn: (msg, ctx) => {
      console.warn(`[test-completion] ${msg}`, ctx ?? {});
    },
  },
});
