export type Severity = "minimal" | "mild" | "moderate" | "severe";

export interface FlaggedItemForRisk {
  questionIndex: number;
  reason: string;
}

export interface TestSessionForRisk {
  id: string;
  testSlug: string;
  testName: string;
  severity: Severity | null;
  flaggedItems: readonly FlaggedItemForRisk[] | null;
  completedAt: Date;
}

export type RiskReason =
  | {
      kind: "severe_test_result";
      sessionId: string;
      testSlug: string;
      testName: string;
      completedAt: Date;
    }
  | {
      kind: "moderate_test_result";
      sessionId: string;
      testSlug: string;
      testName: string;
      completedAt: Date;
    }
  | {
      kind: "flagged_items";
      sessionId: string;
      testSlug: string;
      testName: string;
      completedAt: Date;
    };

export interface RiskStatus {
  status: "normal" | "attention" | "crisis";
  reason: RiskReason | null;
}

export function toRiskSession(r: {
  id: string;
  testSlug: string;
  testName: string;
  severity: string | null;
  flaggedItems: unknown;
  completedAt: Date | null;
}): TestSessionForRisk | null {
  if (r.completedAt === null) return null;
  const flagged = Array.isArray(r.flaggedItems)
    ? (r.flaggedItems as FlaggedItemForRisk[])
    : null;
  return {
    id: r.id,
    testSlug: r.testSlug,
    testName: r.testName,
    severity: (r.severity as Severity | null) ?? null,
    flaggedItems: flagged,
    completedAt: r.completedAt,
  };
}

function mostRecent(
  sessions: readonly TestSessionForRisk[],
  predicate: (s: TestSessionForRisk) => boolean,
): TestSessionForRisk | undefined {
  let chosen: TestSessionForRisk | undefined;
  for (const s of sessions) {
    if (!predicate(s)) continue;
    if (!chosen || s.completedAt > chosen.completedAt) chosen = s;
  }
  return chosen;
}

export function calculateRiskStatus(
  sessions: readonly TestSessionForRisk[],
): RiskStatus {
  const severe = mostRecent(sessions, (s) => s.severity === "severe");
  if (severe) {
    return {
      status: "crisis",
      reason: {
        kind: "severe_test_result",
        sessionId: severe.id,
        testSlug: severe.testSlug,
        testName: severe.testName,
        completedAt: severe.completedAt,
      },
    };
  }
  const flagged = mostRecent(
    sessions,
    (s) => s.flaggedItems !== null && s.flaggedItems.length > 0,
  );
  if (flagged) {
    return {
      status: "crisis",
      reason: {
        kind: "flagged_items",
        sessionId: flagged.id,
        testSlug: flagged.testSlug,
        testName: flagged.testName,
        completedAt: flagged.completedAt,
      },
    };
  }
  const moderate = mostRecent(sessions, (s) => s.severity === "moderate");
  if (moderate) {
    return {
      status: "attention",
      reason: {
        kind: "moderate_test_result",
        sessionId: moderate.id,
        testSlug: moderate.testSlug,
        testName: moderate.testName,
        completedAt: moderate.completedAt,
      },
    };
  }
  return { status: "normal", reason: null };
}
