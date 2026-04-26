/**
 * Единый порог тренда mood (разница недельных средних).
 * Зафиксирован здесь, чтобы устранить расхождение между mood.service.ts (0.3)
 * и mastra/tools/mood-analysis.ts (0.5), существовавшее до #18.
 * Why: tool и service должны давать пользователю один и тот же ответ
 * на вопрос «улучшилось ли настроение».
 */
export const DEFAULT_TREND_THRESHOLD = 0.3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MoodEntry = {
  mood: number;
  factors?: string[] | null;
  createdAt: Date;
};

export type MoodTrend = 'improving' | 'declining' | 'stable' | 'neutral';

export type MoodInsights = {
  weeklyAverage: number | null;
  trend: MoodTrend;
  topFactors: { factor: string; count: number }[];
};

export type ComputeInsightsInput = {
  entries: MoodEntry[];
  lookbackDays: number;
  trendThreshold: number;
  now: Date;
};

function average(arr: MoodEntry[]): number {
  return arr.reduce((sum, e) => sum + e.mood, 0) / arr.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeInsights(input: ComputeInsightsInput): MoodInsights {
  const { entries, lookbackDays, trendThreshold, now } = input;

  if (entries.length === 0) {
    return { weeklyAverage: null, trend: 'neutral', topFactors: [] };
  }

  // Окно сравнения: последняя половина lookbackDays vs предыдущая половина.
  // Для дефолтного lookback=14 это «последние 7 дней» vs «7 дней до них».
  const half = Math.floor(lookbackDays / 2);
  const recentCutoff = new Date(now.getTime() - half * MS_PER_DAY);
  const previousCutoff = new Date(now.getTime() - lookbackDays * MS_PER_DAY);

  const recent = entries.filter((e) => e.createdAt >= recentCutoff);
  const previous = entries.filter(
    (e) => e.createdAt >= previousCutoff && e.createdAt < recentCutoff,
  );

  const weeklyAverage = recent.length > 0 ? round2(average(recent)) : null;

  let trend: MoodTrend = 'stable';
  if (recent.length > 0 && previous.length > 0) {
    const diff = average(recent) - average(previous);
    if (diff > trendThreshold) trend = 'improving';
    else if (diff < -trendThreshold) trend = 'declining';
  }

  // Топ-5 факторов по всем entries в окне lookbackDays.
  const factorCounts: Record<string, number> = {};
  for (const entry of entries) {
    if (!Array.isArray(entry.factors)) continue;
    for (const f of entry.factors) {
      factorCounts[f] = (factorCounts[f] ?? 0) + 1;
    }
  }
  const topFactors = Object.entries(factorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([factor, count]) => ({ factor, count }));

  return { weeklyAverage, trend, topFactors };
}
