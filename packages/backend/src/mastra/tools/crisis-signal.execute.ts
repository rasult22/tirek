import type {
  CrisisSignalRouterInput,
  CrisisSignalRouterResult,
} from "../../modules/crisis-signals/crisis-signal-router.js";

export type CrisisSignalCategory =
  | "bullying"
  | "family"
  | "self_esteem"
  | "academic"
  | "social_isolation"
  | "anxiety"
  | "violence"
  | "other";

export type CrisisSignalToolInput = {
  userId: string;
  sessionId: string;
  type: "acute_crisis" | "concern";
  severity: "high" | "medium" | "low";
  category?: CrisisSignalCategory;
  markers: string[];
  summary: string;
};

export type CrisisSignalToolDeps = {
  router: { route: (input: CrisisSignalRouterInput) => Promise<CrisisSignalRouterResult> };
  logger: { error: (msg: string, ctx?: Record<string, unknown>) => void };
  input: CrisisSignalToolInput;
};

export type CrisisSignalToolOutput =
  | { recorded: true; signalId: string; feed: "red" | "yellow" }
  | { recorded: false };

export async function executeCrisisSignal(
  deps: CrisisSignalToolDeps,
): Promise<CrisisSignalToolOutput> {
  const { router, input } = deps;
  const metadata: Record<string, unknown> = {
    sessionId: input.sessionId,
    markers: input.markers,
  };
  if (input.category !== undefined) metadata.category = input.category;

  try {
    const result = await router.route({
      type: input.type,
      severity: input.severity,
      studentId: input.userId,
      summary: input.summary,
      source: "ai_friend",
      metadata,
    });
    return { recorded: true, signalId: result.signalId, feed: result.feed };
  } catch (error) {
    deps.logger.error("crisis_signal route failed", {
      studentId: input.userId,
      sessionId: input.sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { recorded: false };
  }
}
