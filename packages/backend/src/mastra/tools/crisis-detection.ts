import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../db/index.js";
import {
  sosEvents,
  notifications,
  studentPsychologist,
  users,
} from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const crisisDetectionTool = createTool({
  id: "crisis-detection",
  description: `ОБЯЗАТЕЛЬНО вызови этот инструмент, когда в сообщении ученика ты видишь ЛЮБЫЕ признаки:
- Суицидальные мысли (прямые или косвенные): "не хочу жить", "лучше бы меня не было", "зачем я живу", "устал от жизни", "хочу исчезнуть", и любые похожие по смыслу фразы
- Самоповреждение: порезы, удары себя, любые формы причинения себе вреда
- Насилие: физическое, сексуальное, эмоциональное — над учеником или в семье
- Тяжёлый дистресс: сильное отчаяние, безнадёжность, ощущение что выхода нет

НЕ анализируй ключевые слова — анализируй СМЫСЛ и КОНТЕКСТ. Фраза "я больше не могу" в контексте страданий — это кризис.
Вызывай этот инструмент при МАЛЕЙШЕМ подозрении — лучше перестраховаться.
Инструмент создаст SOS-событие и уведомит психолога. Ученик НЕ увидит, что ты это сделал.`,
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user who sent the message"),
    sessionId: z.string().describe("The chat session ID"),
    severity: z
      .enum(["low", "medium", "high"])
      .describe(
        "high = суицид, самоповреждение, насилие, прямая угроза жизни. medium = сильный дистресс, безнадёжность, буллинг, абьюз. low = тревожность, подавленность, проблемы со сном, постоянный плач.",
      ),
    markers: z
      .array(z.string())
      .describe(
        "Краткое описание обнаруженных признаков кризиса на русском, например: ['суицидальные мысли', 'нежелание жить']",
      ),
    summary: z
      .string()
      .describe(
        "Краткое описание ситуации для психолога на русском, например: 'Ученик выражает нежелание жить после рассказа о буллинге'",
      ),
  }),
  outputSchema: z.object({
    recorded: z.boolean(),
    severity: z.enum(["low", "medium", "high"]),
  }),
  execute: async (params) => {
    const { userId, sessionId, severity, markers, summary } = params;

    // Create SOS event for high and medium severity
    if (severity === "high" || severity === "medium") {
      const sosLevel = severity === "high" ? 2 : 1;
      const sosId = uuidv4();

      try {
        await db.insert(sosEvents).values({
          id: sosId,
          userId,
          level: sosLevel,
          notes: `${summary}. Session: ${sessionId}. Markers: ${markers.join(", ")}`,
        });

        // Find linked psychologists and create notifications
        const linkedPsychologists = await db
          .select({
            psychologistId: studentPsychologist.psychologistId,
            psychologistName: users.name,
          })
          .from(studentPsychologist)
          .innerJoin(users, eq(users.id, studentPsychologist.psychologistId))
          .where(eq(studentPsychologist.studentId, userId));

        if (linkedPsychologists.length === 0) {
          console.warn(`[crisis-detection] No linked psychologists for student ${userId} — SOS event ${sosId} created but no notifications sent`);
        }

        for (const psych of linkedPsychologists) {
          await db.insert(notifications).values({
            id: uuidv4(),
            userId: psych.psychologistId,
            type: "sos_alert",
            title:
              severity === "high"
                ? "🚨 СРОЧНО: Обнаружены критические маркеры кризиса"
                : "⚠️ Внимание: Обнаружены маркеры кризиса",
            body: summary,
            metadata: {
              sosEventId: sosId,
              sessionId,
              severity,
              markers,
            },
          });
        }

        console.log(`[crisis-detection] SOS event ${sosId} created (${severity}), ${linkedPsychologists.length} psychologist(s) notified`);
      } catch (error) {
        console.error("[crisis-detection] Failed to create SOS event or notifications:", error);
      }
    }

    return {
      recorded: true,
      severity,
    };
  },
});
