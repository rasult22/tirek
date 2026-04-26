export type Severity = "minimal" | "mild" | "moderate" | "severe";

export interface ScoringThreshold {
  min: number;
  max: number;
  severity: Severity;
}

export interface ScoringRules {
  thresholds: readonly ScoringThreshold[];
  reverseItems?: readonly number[];
  maxScore: number;
  maxOptionValue: number;
  minOptionValue: number;
}

export interface FlaggedRule {
  questionIndex: number;
  minAnswer: number;
  reason: string;
}

export interface ScoringAnswer {
  questionIndex: number;
  answer: number | null;
}

export interface ScoringQuestion {
  index: number;
}

export interface FlaggedItem {
  questionIndex: number;
  answer: number;
  reason: string;
}

export interface ScoringInput {
  answers: readonly ScoringAnswer[];
  scoringRules: ScoringRules;
  questions: readonly ScoringQuestion[];
  flaggedRules?: readonly FlaggedRule[];
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  severity: Severity;
  flaggedItems: FlaggedItem[];
}

export function computeScore(input: ScoringInput): ScoringResult {
  let totalScore = 0;
  const flaggedItems: FlaggedItem[] = [];
  const flaggedRules = input.flaggedRules ?? [];

  const reverseSet = new Set<number>(input.scoringRules.reverseItems ?? []);
  const { minOptionValue, maxOptionValue } = input.scoringRules;

  for (const a of input.answers) {
    if (a.answer === null || a.answer === undefined) continue;
    const score = reverseSet.has(a.questionIndex)
      ? minOptionValue + maxOptionValue - a.answer
      : a.answer;
    totalScore += score;

    for (const rule of flaggedRules) {
      if (rule.questionIndex === a.questionIndex && a.answer >= rule.minAnswer) {
        flaggedItems.push({
          questionIndex: a.questionIndex,
          answer: a.answer,
          reason: rule.reason,
        });
      }
    }
  }

  const severity = resolveSeverity(totalScore, input.scoringRules.thresholds);
  return {
    totalScore,
    maxScore: input.scoringRules.maxScore,
    severity,
    flaggedItems,
  };
}

function resolveSeverity(
  score: number,
  thresholds: readonly ScoringThreshold[],
): Severity {
  for (const t of thresholds) {
    if (score >= t.min && score <= t.max) return t.severity;
  }
  return "minimal";
}
