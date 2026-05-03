import { z } from "zod";

const reportPayloadSchema = z.object({
  summary: z.string(),
  interpretation: z.string(),
  riskFactors: z.array(
    z.object({
      factor: z.string(),
      severity: z.enum(["low", "moderate", "high"]),
      evidence: z.string().optional(),
    }),
  ),
  recommendations: z.array(
    z.object({
      type: z.enum([
        "therapy",
        "exercise",
        "referral",
        "monitoring",
        "conversation",
      ]),
      text: z.string(),
    }),
  ),
  trend: z.string().nullable(),
  flaggedItems: z.array(
    z.object({
      questionIndex: z.number(),
      reason: z.string(),
    }),
  ),
});

type ReportPayload = z.infer<typeof reportPayloadSchema>;

export const REPORT_MODEL = "gpt-4.1-mini";

// Bump when the system prompt or payload schema materially changes — old
// reports keep the version they were generated under, so we can reproduce
// behaviour when investigating a complaint.
export const PROMPT_VERSION = "v2";

export type ReportLanguage = "ru" | "kz";

export type PersistedReport = {
  id: string;
  sessionId: string;
  status: "pending" | "ready" | "error";
  model: string | null;
  summary: string | null;
  interpretation: string | null;
  riskFactors: unknown;
  recommendations: unknown;
  trend: string | null;
  flaggedItems: unknown;
  tokensUsed: number | null;
  errorMessage: string | null;
  generatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  promptVersion?: string | null;
};

export type PersistedSession = {
  id: string;
  userId: string;
  testId: string;
  assignmentId: string | null;
  totalScore: number | null;
  maxScore: number | null;
  severity: string | null;
  completedAt: Date | null;
  flaggedItems?: unknown;
};

export type PersistedTest = {
  id: string;
  slug: string;
  nameRu: string;
  description: string | null;
  questions: unknown;
  scoringRules?: unknown;
};

export type PersistedAnswer = {
  sessionId: string;
  questionIndex: number;
  answer: number;
  score: number | null;
};

export type PersistedStudent = {
  id: string;
  name: string;
  grade: number | null;
  classLetter: string | null;
};

export type ReportUpdateFields = Partial<{
  status: "pending" | "ready" | "error";
  model: string | null;
  summary: string | null;
  interpretation: string | null;
  riskFactors: unknown;
  recommendations: unknown;
  trend: string | null;
  flaggedItems: unknown;
  tokensUsed: number | null;
  errorMessage: string | null;
  generatedAt: Date | null;
  promptVersion: string | null;
}>;

export type LlmCall = (input: {
  systemPrompt: string;
  userPayload: unknown;
}) => Promise<{ content: string; tokensUsed: number | null }>;

export type AiReportServiceDeps = {
  findReportBySessionId: (sessionId: string) => Promise<PersistedReport | null>;
  insertPendingReport: (data: {
    id: string;
    sessionId: string;
  }) => Promise<PersistedReport>;
  updateReport: (
    sessionId: string,
    fields: ReportUpdateFields,
  ) => Promise<PersistedReport | null>;
  findSessionById: (id: string) => Promise<PersistedSession | null>;
  findTestById: (id: string) => Promise<PersistedTest | null>;
  findAnswersBySession: (sessionId: string) => Promise<PersistedAnswer[]>;
  findStudentById: (id: string) => Promise<PersistedStudent | null>;
  findHistoryForUser: (
    userId: string,
    testId: string,
    excludeSessionId: string,
  ) => Promise<
    Array<{
      id: string;
      userId: string;
      testId: string;
      totalScore: number | null;
      maxScore: number | null;
      severity: string | null;
      completedAt: Date | null;
    }>
  >;
  resolveReportLanguage: (input: {
    studentId: string;
    testId: string;
    assignmentId: string | null;
  }) => Promise<ReportLanguage>;
  callLLM: LlmCall | null;
  newId: () => string;
  now: () => Date;
};

type ClinicalContext = {
  thresholds: unknown;
  maxScore: number | null;
  flaggedRules: unknown;
} | null;

export function buildClinicalContext(scoringRules: unknown): ClinicalContext {
  if (!scoringRules || typeof scoringRules !== "object") return null;
  const sr = scoringRules as {
    thresholds?: unknown;
    maxScore?: unknown;
    flaggedRules?: unknown;
  };
  return {
    thresholds: Array.isArray(sr.thresholds) ? sr.thresholds : [],
    maxScore: typeof sr.maxScore === "number" ? sr.maxScore : null,
    flaggedRules: Array.isArray(sr.flaggedRules) ? sr.flaggedRules : [],
  };
}

export function buildSystemPrompt(
  language: ReportLanguage,
  opts: { hasServerFlaggedItems?: boolean } = {},
): string {
  const langDirective =
    language === "kz"
      ? "ҚАЗАҚ тілінде жаз — мектеп психологы үшін есеп құжат, оның интерфейсі қазақ тілінде."
      : "Пиши на РУССКОМ языке — отчёт для школьного психолога с русскоязычным интерфейсом.";

  const serverFlaggedDirective = opts.hasServerFlaggedItems
    ? `\n- result.serverFlaggedItems — это пункты, помеченные сервером по клиническим правилам (например, суицидальные мысли). КАЖДЫЙ такой пункт ОБЯЗАТЕЛЬНО отрази в riskFactors с severity = "high" и в flaggedItems с тем же questionIndex.`
    : "";

  return `Ты — клинический психолог-ассистент, который помогает школьному психологу интерпретировать результаты психодиагностического теста ученика.

Твоя задача — сгенерировать структурированный отчёт.

Язык отчёта: ${langDirective}

Используй clinicalContext.thresholds (диапазоны баллов и их severity-уровни) и clinicalContext.maxScore как клинические нормы теста. Не выдумывай симптомы, которых нет в вопросах: ссылайся в evidence только на реально присутствующие answers[].questionIndex. Severity в riskFactors должна быть согласована с серверным result.severity.

Требования:
- Только JSON по указанной схеме, без markdown и лишнего текста.
- Используй профессиональный, но не пугающий язык.
- Не ставь диагнозов. Формулируй как "признаки", "симптомы совместимы с", "следует обратить внимание".
- Рекомендации — практичные, применимые в школьной среде. Типы: "therapy" (индивидуальная беседа), "exercise" (упражнения: дыхание, заземление, дневник), "referral" (направление к специалисту), "monitoring" (наблюдение и повторная оценка), "conversation" (разговор с психологом/родителями).
- riskFactors.severity: "low" | "moderate" | "high".
- flaggedItems — это questionIndex тех пунктов, ответы на которые особенно тревожны (например, вопросы о суицидальных мыслях или самоповреждении с высоким значением). Если таких нет — пустой массив.${serverFlaggedDirective}
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
}

export function createAiReportService(deps: AiReportServiceDeps) {
  const service = {
    async findBySessionId(sessionId: string) {
      return deps.findReportBySessionId(sessionId);
    },

    async ensurePending(sessionId: string) {
      const existing = await deps.findReportBySessionId(sessionId);
      if (existing) return existing;
      return deps.insertPendingReport({ id: deps.newId(), sessionId });
    },

    async resetToPending(sessionId: string) {
      const existing = await deps.findReportBySessionId(sessionId);
      if (!existing) {
        return service.ensurePending(sessionId);
      }
      return deps.updateReport(sessionId, {
        status: "pending",
        errorMessage: null,
      });
    },

    async generateReport(sessionId: string): Promise<void> {
      try {
        await service.ensurePending(sessionId);

        const session = await deps.findSessionById(sessionId);
        if (!session) throw new Error("Session not found");
        if (!session.completedAt) throw new Error("Session is not completed");

        const test = await deps.findTestById(session.testId);
        if (!test) throw new Error("Test not found");

        const answers = await deps.findAnswersBySession(sessionId);
        const student = await deps.findStudentById(session.userId);
        const history = await deps.findHistoryForUser(
          session.userId,
          session.testId,
          sessionId,
        );

        if (!deps.callLLM) {
          await deps.updateReport(sessionId, {
            status: "error",
            errorMessage: "OPENAI_API_KEY is not configured",
          });
          return;
        }

        const language = await deps.resolveReportLanguage({
          studentId: session.userId,
          testId: session.testId,
          assignmentId: session.assignmentId,
        });

        const questions = (test.questions as Array<{
          index?: number;
          textRu?: string;
          options?: Array<{ value: number; labelRu?: string }>;
        }>) ?? [];

        const answeredItems = answers.map((a) => {
          const q = questions.find(
            (x) => (x.index ?? questions.indexOf(x)) === a.questionIndex,
          );
          const optionLabel = q?.options?.find((o) => o.value === a.answer)?.labelRu;
          return {
            questionIndex: a.questionIndex,
            questionText: q?.textRu ?? null,
            answerValue: a.answer,
            answerLabel: optionLabel ?? null,
            score: a.score,
          };
        });

        const clinicalContext = buildClinicalContext(test.scoringRules);
        const serverFlaggedItems = Array.isArray(session.flaggedItems)
          ? session.flaggedItems
          : [];

        const userPayload = {
          test: {
            slug: test.slug,
            name: test.nameRu,
            description: test.description,
          },
          clinicalContext,
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
            serverFlaggedItems,
          },
          previousResults: history.map((h) => ({
            totalScore: h.totalScore,
            maxScore: h.maxScore,
            severity: h.severity,
            completedAt: h.completedAt?.toISOString() ?? null,
          })),
          answers: answeredItems,
          reportLanguage: language,
        };

        const systemPrompt = buildSystemPrompt(language, {
          hasServerFlaggedItems: serverFlaggedItems.length > 0,
        });

        const { content, tokensUsed } = await deps.callLLM({
          systemPrompt,
          userPayload,
        });

        let raw: unknown;
        try {
          raw = JSON.parse(content || "{}");
        } catch (parseErr) {
          const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          throw new Error(`Invalid LLM output: not JSON (${msg})`);
        }
        const validated = reportPayloadSchema.safeParse(raw);
        if (!validated.success) {
          throw new Error(
            `Invalid LLM output: ${validated.error.issues
              .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
              .join("; ")}`,
          );
        }
        const payload: ReportPayload = validated.data;

        await deps.updateReport(sessionId, {
          status: "ready",
          model: REPORT_MODEL,
          promptVersion: PROMPT_VERSION,
          summary: payload.summary,
          interpretation: payload.interpretation,
          riskFactors: payload.riskFactors,
          recommendations: payload.recommendations,
          trend: payload.trend,
          flaggedItems: payload.flaggedItems,
          tokensUsed,
          errorMessage: null,
          generatedAt: deps.now(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[ai-report] generation failed", sessionId, message);
        try {
          await deps.updateReport(sessionId, {
            status: "error",
            errorMessage: message.slice(0, 1000),
          });
        } catch (writeErr) {
          console.error("[ai-report] failed to persist error", writeErr);
        }
      }
    },
  };

  return service;
}

export type AiReportService = ReturnType<typeof createAiReportService>;

// ── Report language resolver ──────────────────────────────────────────
//
// Picks the language for the AI Test Report. The report is written for the
// **psychologist**, so we prefer the language of the psychologist who assigned
// the test. The chain (highest priority first) is:
//
//   1. The assigner of the assignment that started the session (assignedBy).
//   2. The most recent assignment of this test that targets this student.
//   3. The first linked psychologist in student_psychologist (by assignedAt).
//   4. "ru" as the ultimate fallback.

export type ReportLanguageResolverDeps = {
  findAssignmentLanguageById: (
    assignmentId: string,
  ) => Promise<string | null | undefined>;
  findRecentTestAssignmentLanguage: (
    studentId: string,
    testId: string,
  ) => Promise<string | null | undefined>;
  findFirstLinkedPsychologistLanguage: (
    studentId: string,
  ) => Promise<string | null | undefined>;
};

function normalizeLanguage(lang: string | null | undefined): ReportLanguage {
  return lang === "kz" ? "kz" : "ru";
}

export function createReportLanguageResolver(
  deps: ReportLanguageResolverDeps,
) {
  return async function resolveReportLanguage(input: {
    studentId: string;
    testId: string;
    assignmentId: string | null;
  }): Promise<ReportLanguage> {
    if (input.assignmentId) {
      const fromAssignment = await deps.findAssignmentLanguageById(
        input.assignmentId,
      );
      if (fromAssignment) return normalizeLanguage(fromAssignment);
    }

    const fromRecent = await deps.findRecentTestAssignmentLanguage(
      input.studentId,
      input.testId,
    );
    if (fromRecent) return normalizeLanguage(fromRecent);

    const fromLinked = await deps.findFirstLinkedPsychologistLanguage(
      input.studentId,
    );
    if (fromLinked) return normalizeLanguage(fromLinked);

    return "ru";
  };
}
