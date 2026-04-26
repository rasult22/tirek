import {
  computeInsights,
  DEFAULT_TREND_THRESHOLD,
  type MoodEntry,
} from '../../lib/mood-aggregator/mood-aggregator.js';
import {
  insightsToToolOutput,
  type ToolOutput,
} from '../../lib/mood-aggregator/insights-to-tool-output.js';

const LOOKBACK_DAYS = 14;

export type ToolMoodEntry = MoodEntry & {
  stressLevel?: number | null;
  sleepQuality?: number | null;
};

export type AnalyzeMoodEntriesInput = {
  entries: ToolMoodEntry[];
  now: Date;
  trendThreshold?: number;
};

/**
 * Pure-сторона moodAnalysisTool: считает insights через единый computeInsights
 * и форматирует под AI-friendly output. БД не трогает — execute поверх неё
 * остаётся тонким I/O-слоем.
 *
 * Why: чтобы boundary-тест мог проверить, что service и tool возвращают
 * один verdict для одного набора entries, минуя БД.
 */
export function analyzeMoodEntries(input: AnalyzeMoodEntriesInput): ToolOutput {
  const { entries, now, trendThreshold = DEFAULT_TREND_THRESHOLD } = input;

  const insights = computeInsights({
    entries: entries.map((e) => ({
      mood: e.mood,
      factors: e.factors,
      createdAt: e.createdAt,
    })),
    lookbackDays: LOOKBACK_DAYS,
    trendThreshold,
    now,
  });

  const stressEntries = entries.filter((e) => e.stressLevel != null);
  const avgStress =
    stressEntries.length > 0
      ? stressEntries.reduce((sum, e) => sum + (e.stressLevel ?? 0), 0) /
        stressEntries.length
      : null;

  const sleepEntries = entries.filter((e) => e.sleepQuality != null);
  const avgSleep =
    sleepEntries.length > 0
      ? sleepEntries.reduce((sum, e) => sum + (e.sleepQuality ?? 0), 0) /
        sleepEntries.length
      : null;

  return insightsToToolOutput({ insights, avgStress, avgSleep });
}

export { LOOKBACK_DAYS };
