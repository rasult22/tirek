import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../db/index.js";
import { moodEntries } from "../../db/schema.js";
import { eq, desc, gte, and } from "drizzle-orm";
import {
  computeInsights,
  DEFAULT_TREND_THRESHOLD,
} from "../../lib/mood-aggregator/mood-aggregator.js";
import { insightsToToolOutput } from "../../lib/mood-aggregator/insights-to-tool-output.js";

const LOOKBACK_DAYS = 14;

export const moodAnalysisTool = createTool({
  id: "mood-analysis",
  description:
    "Analyzes a student's mood entries over the last 14 days, calculating average mood, trend direction, and generating insights in Russian.",
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user whose mood to analyze"),
  }),
  outputSchema: z.object({
    averageMood: z.number(),
    trend: z.enum(["improving", "stable", "declining"]),
    recentEntries: z.number(),
    insights: z.array(z.string()),
  }),
  execute: async (params) => {
    const { userId } = params;

    const now = new Date();
    const cutoff = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.createdAt, cutoff),
        ),
      )
      .orderBy(desc(moodEntries.createdAt));

    const insights = computeInsights({
      entries: entries.map((e) => ({
        mood: e.mood,
        factors: e.factors as string[] | null,
        createdAt: e.createdAt,
      })),
      lookbackDays: LOOKBACK_DAYS,
      trendThreshold: DEFAULT_TREND_THRESHOLD,
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
  },
});
