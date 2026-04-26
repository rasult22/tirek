import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../db/index.js";
import { moodEntries } from "../../db/schema.js";
import { eq, desc, gte, and } from "drizzle-orm";
import { analyzeMoodEntries, LOOKBACK_DAYS } from "./mood-analysis-core.js";

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

    return analyzeMoodEntries({
      entries: entries.map((e) => ({
        mood: e.mood,
        factors: e.factors as string[] | null,
        createdAt: e.createdAt,
        stressLevel: e.stressLevel,
        sleepQuality: e.sleepQuality,
      })),
      now,
    });
  },
});
