export type MoodEntryInput = {
  mood: number;
  factors: string[] | null;
};

export type SessionInput = {
  severity: 'low' | 'moderate' | 'high' | null;
  completedAt: Date | null;
};

export type ClassStatsInput = {
  entries: MoodEntryInput[];
  sessions: SessionInput[];
  totalStudents: number;
};

export type ClassStats = {
  averageMood: number | null;
  moodDistribution: { happy: number; neutral: number; sad: number };
  testCompletionRate: number;
  atRiskCount: number;
  topFactors: Array<{ factor: string; count: number }>;
  riskDistribution: { normal: number; attention: number; crisis: number };
};

const SEVERITY_TO_RISK: Record<'low' | 'moderate' | 'high', 'normal' | 'attention' | 'crisis'> = {
  low: 'normal',
  moderate: 'attention',
  high: 'crisis',
};

export function computeClassStats(input: ClassStatsInput): ClassStats {
  const { entries, sessions } = input;

  const averageMood =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
      : null;

  const moodDistribution = { happy: 0, neutral: 0, sad: 0 };
  for (const e of entries) {
    if (e.mood >= 4) moodDistribution.happy += 1;
    else if (e.mood === 3) moodDistribution.neutral += 1;
    else moodDistribution.sad += 1;
  }

  const riskDistribution = { normal: 0, attention: 0, crisis: 0 };
  for (const s of sessions) {
    if (s.severity == null) continue;
    const bucket = SEVERITY_TO_RISK[s.severity];
    riskDistribution[bucket] += 1;
  }

  const atRiskCount = riskDistribution.attention + riskDistribution.crisis;

  const completedSessions = sessions.filter((s) => s.completedAt != null).length;
  const testCompletionRate =
    input.totalStudents > 0 ? completedSessions / input.totalStudents : 0;

  const factorCounts: Record<string, number> = {};
  for (const e of entries) {
    if (!e.factors) continue;
    for (const f of e.factors) {
      factorCounts[f] = (factorCounts[f] ?? 0) + 1;
    }
  }
  const topFactors = Object.entries(factorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([factor, count]) => ({ factor, count }));

  return {
    averageMood,
    moodDistribution,
    testCompletionRate,
    atRiskCount,
    topFactors,
    riskDistribution,
  };
}
