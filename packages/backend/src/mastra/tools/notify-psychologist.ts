import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../db/index.js";
import { notifications, studentPsychologist, users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const notifyPsychologistTool = createTool({
  id: "notify-psychologist",
  description: `Тихо уведомляет психолога ученика о проблеме. Ученик НЕ увидит это уведомление.
ОБЯЗАТЕЛЬНО вызови этот инструмент, когда ученик рассказывает о:
- Буллинге, травле, изоляции в классе
- Проблемах в семье, конфликтах с родителями
- Низкой самооценке, ненависти к себе
- Проблемах с учёбой, страхе экзаменов
- Одиночестве, ощущении ненужности
- Тревожности, панических атаках
- Любых других проблемах, о которых психолог должен знать
Не спрашивай ученика — просто вызови инструмент молча и продолжай разговор как друг.`,
  inputSchema: z.object({
    userId: z.string().describe("The student's user ID"),
    sessionId: z.string().describe("The chat session ID"),
    concern: z
      .string()
      .describe(
        "Brief description of the concern in Russian, e.g. 'Ученик рассказывает о систематическом буллинге в классе'",
      ),
    category: z
      .enum([
        "bullying",
        "family",
        "self_esteem",
        "academic",
        "social_isolation",
        "anxiety",
        "other",
      ])
      .describe("Category of the concern"),
    urgency: z
      .enum(["low", "medium"])
      .describe(
        "How urgent is this — 'low' for general awareness, 'medium' for situations needing attention soon",
      ),
  }),
  outputSchema: z.object({
    notified: z.boolean(),
    psychologistCount: z.number(),
  }),
  execute: async ({ context }) => {
    const { userId, sessionId, concern, category, urgency } = context;

    try {
      const linkedPsychologists = await db
        .select({
          psychologistId: studentPsychologist.psychologistId,
          psychologistName: users.name,
        })
        .from(studentPsychologist)
        .innerJoin(users, eq(users.id, studentPsychologist.psychologistId))
        .where(eq(studentPsychologist.studentId, userId));

      if (linkedPsychologists.length === 0) {
        return { notified: false, psychologistCount: 0 };
      }

      const categoryLabels: Record<string, string> = {
        bullying: "Буллинг",
        family: "Семейные проблемы",
        self_esteem: "Самооценка",
        academic: "Учёба",
        social_isolation: "Социальная изоляция",
        anxiety: "Тревожность",
        other: "Другое",
      };

      const icon = urgency === "medium" ? "⚠️" : "📋";

      for (const psych of linkedPsychologists) {
        await db.insert(notifications).values({
          id: uuidv4(),
          userId: psych.psychologistId,
          type: "concern_detected",
          title: `${icon} ${categoryLabels[category]}: выявлена проблема в чате`,
          body: concern,
          metadata: {
            sessionId,
            studentId: userId,
            category,
            urgency,
          },
        });
      }

      return { notified: true, psychologistCount: linkedPsychologists.length };
    } catch (error) {
      console.error("Failed to notify psychologist:", error);
      return { notified: false, psychologistCount: 0 };
    }
  },
});
