import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../db/index.js";
import { moodEntries } from "../../db/schema.js";
import { eq, desc, gte, and } from "drizzle-orm";
import {
  computeInsights,
  DEFAULT_TREND_THRESHOLD,
} from "../../lib/mood-aggregator/mood-aggregator.js";

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
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.createdAt, fourteenDaysAgo),
        ),
      )
      .orderBy(desc(moodEntries.createdAt));

    if (entries.length === 0) {
      return {
        averageMood: 0,
        trend: "stable" as const,
        recentEntries: 0,
        insights: [
          "За последние 14 дней нет записей настроения. Попробуй отмечать своё настроение каждый день — это поможет лучше понять себя.",
        ],
      };
    }

    const aggregated = computeInsights({
      entries: entries.map((e) => ({
        mood: e.mood,
        factors: e.factors as string[] | null,
        createdAt: e.createdAt,
      })),
      lookbackDays: 14,
      trendThreshold: DEFAULT_TREND_THRESHOLD,
      now,
    });

    // Среднее по всем 14 дням (а не только за последнюю неделю), как было до #18.
    const totalMood = entries.reduce((sum, e) => sum + e.mood, 0);
    const averageMood = Math.round((totalMood / entries.length) * 10) / 10;

    // Tool отдаёт только три вида тренда; neutral не возникает (есть entries).
    const trend: "improving" | "stable" | "declining" =
      aggregated.trend === "neutral" ? "stable" : aggregated.trend;

    const insights: string[] = [];

    if (averageMood >= 4) {
      insights.push(
        "Твоё настроение за последние две недели в целом хорошее. Отлично! Продолжай делать то, что приносит тебе радость.",
      );
    } else if (averageMood >= 3) {
      insights.push(
        "Твоё настроение за последние две недели — среднее. Это нормально, но обрати внимание на то, что помогает тебе чувствовать себя лучше.",
      );
    } else if (averageMood >= 2) {
      insights.push(
        "Твоё настроение за последние две недели было пониженным. Подумай, что могло на это повлиять, и попробуй поговорить с кем-то, кому доверяешь.",
      );
    } else {
      insights.push(
        "Твоё настроение за последние две недели было низким. Пожалуйста, поговори с школьным психологом — он(а) может помочь.",
      );
    }

    if (trend === "improving") {
      insights.push(
        "Хорошая новость — за последнюю неделю твоё настроение улучшилось по сравнению с предыдущей.",
      );
    } else if (trend === "declining") {
      insights.push(
        "За последнюю неделю твоё настроение немного снизилось. Это может быть временным, но стоит обратить внимание.",
      );
    }

    // Analyze stress levels if available
    const stressEntries = entries.filter((e) => e.stressLevel != null);
    if (stressEntries.length > 0) {
      const avgStress =
        stressEntries.reduce((sum, e) => sum + (e.stressLevel ?? 0), 0) /
        stressEntries.length;
      if (avgStress >= 4) {
        insights.push(
          "Уровень стресса довольно высокий. Попробуй дыхательные упражнения или поговори с кем-то о том, что тебя беспокоит.",
        );
      }
    }

    // Analyze sleep quality if available
    const sleepEntries = entries.filter((e) => e.sleepQuality != null);
    if (sleepEntries.length > 0) {
      const avgSleep =
        sleepEntries.reduce((sum, e) => sum + (e.sleepQuality ?? 0), 0) /
        sleepEntries.length;
      if (avgSleep <= 2) {
        insights.push(
          "Качество сна было не очень хорошим. Сон сильно влияет на настроение — попробуй ложиться в одно время и убрать телефон за час до сна.",
        );
      }
    }

    if (entries.length < 7) {
      insights.push(
        `За 14 дней ты сделал(а) ${entries.length} записей. Старайся отмечать настроение каждый день — так картина будет точнее.`,
      );
    }

    return {
      averageMood,
      trend,
      recentEntries: entries.length,
      insights,
    };
  },
});
