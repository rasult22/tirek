import type { Severity } from "./test-scoring-engine.js";
import type { CrisisSignalInput } from "../crisis-signals/index.js";

export interface SuggestedAction {
  type: "exercise" | "journal" | "chat" | "hotline";
  textKey: string;
  deeplink: string;
}

export interface CompletedSessionFlaggedItem {
  questionIndex: number;
  answer: number;
  reason: string;
}

export interface CompletedSession {
  id: string;
  userId: string;
  testId: string;
  completedAt: Date;
  totalScore: number;
  maxScore: number;
  severity: Severity;
  flaggedItems: CompletedSessionFlaggedItem[];
}

export interface TestForCompletion {
  id: string;
  slug: string;
}

export interface TestAnswerForCompletion {
  questionIndex: number;
  answer: number;
}

export interface StudentCompletionResponse {
  completed: true;
  sessionId: string;
  severity: Severity;
  requiresSupport: boolean;
  suggestedActions: SuggestedAction[];
  aiReportStatus: "pending" | "failed";
}

export interface TestCompletionInput {
  userId: string;
  sessionId: string;
}

export interface TestCompletionDeps {
  completeSession: (input: {
    sessionId: string;
    userId: string;
  }) => Promise<CompletedSession>;
  findTestById: (testId: string) => Promise<TestForCompletion | null>;
  findAnswersBySession: (
    sessionId: string,
  ) => Promise<TestAnswerForCompletion[]>;
  reportCrisisSignal: (signal: CrisisSignalInput) => Promise<void>;
  ensureAiReportPending: (sessionId: string) => Promise<void>;
  scheduleAiReportGeneration: (sessionId: string) => void;
  isAiReportAvailable: () => boolean;
  recordProductiveAction: (userId: string, kind: string) => Promise<void>;
  logger: { warn: (msg: string, ctx?: Record<string, unknown>) => void };
}

export const NORMAL_ACTIONS: SuggestedAction[] = [
  {
    type: "exercise",
    textKey: "completion.action.breathing",
    deeplink: "/exercises",
  },
  {
    type: "journal",
    textKey: "completion.action.journal",
    deeplink: "/journal/new",
  },
];

export const SOFT_ESCALATION_ACTIONS: SuggestedAction[] = [
  {
    type: "chat",
    textKey: "completion.action.chatPsychologist",
    deeplink: "/chat",
  },
  { type: "hotline", textKey: "completion.action.hotline", deeplink: "tel:150" },
  {
    type: "exercise",
    textKey: "completion.action.breathing",
    deeplink: "/exercises",
  },
];

interface SeverityProfile {
  actions: SuggestedAction[];
  escalate: boolean;
}

const SEVERITY_PROFILES: Record<Severity, SeverityProfile> = {
  minimal: { actions: NORMAL_ACTIONS, escalate: false },
  mild: { actions: NORMAL_ACTIONS, escalate: false },
  moderate: { actions: SOFT_ESCALATION_ACTIONS, escalate: false },
  severe: { actions: SOFT_ESCALATION_ACTIONS, escalate: true },
};

export function createTestCompletion(deps: TestCompletionDeps) {
  return {
    async handle(
      input: TestCompletionInput,
    ): Promise<StudentCompletionResponse> {
      const session = await deps.completeSession({
        sessionId: input.sessionId,
        userId: input.userId,
      });

      const profile = SEVERITY_PROFILES[session.severity];
      const escalate = profile.escalate || session.flaggedItems.length > 0;

      if (escalate) {
        const test = await deps.findTestById(session.testId);
        if (test) {
          try {
            await deps.reportCrisisSignal({
              source: "test_session",
              userId: session.userId,
              testSessionId: session.id,
              testSlug: test.slug,
              testSeverity: "severe",
              flaggedItems: session.flaggedItems,
            });
          } catch (e) {
            deps.logger.warn("crisis routing failed", {
              sessionId: session.id,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
      }

      let aiReportStatus: "pending" | "failed" = "failed";
      if (deps.isAiReportAvailable()) {
        try {
          await deps.ensureAiReportPending(session.id);
          deps.scheduleAiReportGeneration(session.id);
          aiReportStatus = "pending";
        } catch (e) {
          deps.logger.warn("failed to ensure AI report row", {
            sessionId: session.id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      deps
        .recordProductiveAction(session.userId, "test")
        .catch(() => {});

      return {
        completed: true,
        sessionId: session.id,
        severity: session.severity,
        requiresSupport: escalate,
        suggestedActions: profile.actions,
        aiReportStatus,
      };
    },
  };
}
