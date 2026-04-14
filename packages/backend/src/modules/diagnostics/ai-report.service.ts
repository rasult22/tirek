import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  diagnosticAiReports,
  diagnosticAnswers,
  diagnosticSessions,
  diagnosticTests,
  users,
} from "../../db/schema.js";
import { env } from "../../config/env.js";

const MODEL = "gpt-4.1-mini";

interface RiskFactor {
  factor: string;
  severity: "low" | "moderate" | "high";
  evidence?: string;
}

interface Recommendation {
  type: "therapy" | "exercise" | "referral" | "monitoring" | "conversation";
  text: string;
}

interface FlaggedItem {
  questionIndex: number;
  reason: string;
}

interface ReportPayload {
  summary: string;
  interpretation: string;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  trend: string | null;
  flaggedItems: FlaggedItem[];
}

function getClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export const aiReportService = {
  /**
   * Find an existing report record for a session, or null.
   */
  async findBySessionId(sessionId: string) {
    const [row] = await db
      .select()
      .from(diagnosticAiReports)
      .where(eq(diagnosticAiReports.sessionId, sessionId))
      .limit(1);
    return row ?? null;
  },

  /**
   * Create a new report record with status "pending". Idempotent: if a record
   * already exists for the session, returns it untouched.
   */
  async ensurePending(sessionId: string) {
    const existing = await this.findBySessionId(sessionId);
    if (existing) return existing;
    const [created] = await db
      .insert(diagnosticAiReports)
      .values({
        id: uuidv4(),
        sessionId,
        status: "pending",
      })
      .returning();
    return created;
  },

  /**
   * Mark an existing report back to pending (used for regeneration).
   */
  async resetToPending(sessionId: string) {
    const existing = await this.findBySessionId(sessionId);
    if (!existing) {
      return this.ensurePending(sessionId);
    }
    const [updated] = await db
      .update(diagnosticAiReports)
      .set({
        status: "pending",
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(diagnosticAiReports.sessionId, sessionId))
      .returning();
    return updated;
  },

  /**
   * Generate an AI report for a completed session. Safe to call in background
   * (fire-and-forget) — swallows errors by writing them into the report row.
   */
  async generateReport(sessionId: string): Promise<void> {
    try {
      await this.ensurePending(sessionId);

      const [session] = await db
        .select()
        .from(diagnosticSessions)
        .where(eq(diagnosticSessions.id, sessionId))
        .limit(1);
      if (!session) throw new Error("Session not found");
      if (!session.completedAt) throw new Error("Session is not completed");

      const [test] = await db
        .select()
        .from(diagnosticTests)
        .where(eq(diagnosticTests.id, session.testId))
        .limit(1);
      if (!test) throw new Error("Test not found");

      const answers = await db
        .select()
        .from(diagnosticAnswers)
        .where(eq(diagnosticAnswers.sessionId, sessionId))
        .orderBy(diagnosticAnswers.questionIndex);

      const [student] = await db
        .select({
          id: users.id,
          name: users.name,
          grade: users.grade,
          classLetter: users.classLetter,
        })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      // Previous completed sessions of the same test, for trend analysis
      const history = await db
        .select({
          id: diagnosticSessions.id,
          totalScore: diagnosticSessions.totalScore,
          maxScore: diagnosticSessions.maxScore,
          severity: diagnosticSessions.severity,
          completedAt: diagnosticSessions.completedAt,
        })
        .from(diagnosticSessions)
        .where(
          and(
            eq(diagnosticSessions.userId, session.userId),
            eq(diagnosticSessions.testId, session.testId),
            sql`${diagnosticSessions.completedAt} IS NOT NULL`,
            sql`${diagnosticSessions.id} <> ${sessionId}`,
          ),
        )
        .orderBy(desc(diagnosticSessions.completedAt))
        .limit(5);

      const client = getClient();
      if (!client) {
        await db
          .update(diagnosticAiReports)
          .set({
            status: "error",
            errorMessage: "OPENAI_API_KEY is not configured",
            updatedAt: new Date(),
          })
          .where(eq(diagnosticAiReports.sessionId, sessionId));
        return;
      }

      // Build a compact payload for the prompt
      const questions = (test.questions as Array<{
        index?: number;
        textRu?: string;
        options?: Array<{ value: number; labelRu?: string }>;
      }>) ?? [];

      const answeredItems = answers.map((a) => {
        const q = questions.find((x) => (x.index ?? questions.indexOf(x)) === a.questionIndex);
        const optionLabel = q?.options?.find((o) => o.value === a.answer)?.labelRu;
        return {
          questionIndex: a.questionIndex,
          questionText: q?.textRu ?? null,
          answerValue: a.answer,
          answerLabel: optionLabel ?? null,
          score: a.score,
        };
      });

      const userPayload = {
        test: {
          slug: test.slug,
          name: test.nameRu,
          description: test.description,
        },
        student: {
          name: student?.name ?? null,
          grade: student?.grade ?? null,
          classLetter: student?.classLetter ?? null,
        },
        result: {
          totalScore: session.totalScore,
          maxScore: session.maxScore,
          severity: session.severity,
          completedAt: session.completedAt?.toISOString() ?? null,
        },
        previousResults: history.map((h) => ({
          totalScore: h.totalScore,
          maxScore: h.maxScore,
          severity: h.severity,
          completedAt: h.completedAt?.toISOString() ?? null,
        })),
        answers: answeredItems,
      };

      const systemPrompt = `Ты — клинический психолог-ассистент, который помогает школьному психологу интерпретировать результаты психодиагностического теста ученика.

Твоя задача — сгенерировать структурированный отчёт на русском языке.

Требования:
- Только JSON по указанной схеме, без markdown и лишнего текста.
- Используй профессиональный, но не пугающий язык.
- Не ставь диагнозов. Формулируй как "признаки", "симптомы совместимы с", "следует обратить внимание".
- Рекомендации — практичные, применимые в школьной среде. Типы: "therapy" (индивидуальная беседа), "exercise" (упражнения: дыхание, заземление, дневник), "referral" (направление к специалисту), "monitoring" (наблюдение и повторная оценка), "conversation" (разговор с психологом/родителями).
- riskFactors.severity: "low" | "moderate" | "high".
- flaggedItems — это questionIndex тех пунктов, ответы на которые особенно тревожны (например, вопросы о суицидальных мыслях или самоповреждении с высоким значением). Если таких нет — пустой массив.
- trend: если previousResults непуст — кратко сравни с предыдущей попыткой ("ухудшение", "улучшение", "стабильно"). Если пуст — верни null.
- summary — 1-2 предложения, самая суть.
- interpretation — 3-6 предложений с клинической интерпретацией скора и ключевых паттернов в ответах.

Схема JSON:
{
  "summary": string,
  "interpretation": string,
  "riskFactors": [{ "factor": string, "severity": "low"|"moderate"|"high", "evidence": string }],
  "recommendations": [{ "type": "therapy"|"exercise"|"referral"|"monitoring"|"conversation", "text": string }],
  "trend": string | null,
  "flaggedItems": [{ "questionIndex": number, "reason": string }]
}`;

      const completion = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content) as Partial<ReportPayload>;

      const payload: ReportPayload = {
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        interpretation:
          typeof parsed.interpretation === "string" ? parsed.interpretation : "",
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
        trend: typeof parsed.trend === "string" ? parsed.trend : null,
        flaggedItems: Array.isArray(parsed.flaggedItems)
          ? parsed.flaggedItems
          : [],
      };

      const tokensUsed = completion.usage?.total_tokens ?? null;

      await db
        .update(diagnosticAiReports)
        .set({
          status: "ready",
          model: MODEL,
          summary: payload.summary,
          interpretation: payload.interpretation,
          riskFactors: payload.riskFactors,
          recommendations: payload.recommendations,
          trend: payload.trend,
          flaggedItems: payload.flaggedItems,
          tokensUsed,
          errorMessage: null,
          generatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(diagnosticAiReports.sessionId, sessionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[ai-report] generation failed", sessionId, message);
      try {
        await db
          .update(diagnosticAiReports)
          .set({
            status: "error",
            errorMessage: message.slice(0, 1000),
            updatedAt: new Date(),
          })
          .where(eq(diagnosticAiReports.sessionId, sessionId));
      } catch (writeErr) {
        console.error("[ai-report] failed to persist error", writeErr);
      }
    }
  },
};
