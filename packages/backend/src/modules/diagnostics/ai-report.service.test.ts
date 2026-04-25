import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createAiReportService,
  createReportLanguageResolver,
  type AiReportServiceDeps,
  type PersistedReport,
  type PersistedSession,
  type PersistedTest,
  type PersistedAnswer,
  type PersistedStudent,
  type ReportLanguageResolverDeps,
} from "./ai-report.service.js";

type Fakes = {
  reports: PersistedReport[];
  sessions: PersistedSession[];
  tests: PersistedTest[];
  answers: PersistedAnswer[];
  students: PersistedStudent[];
  history: Array<{
    id: string;
    userId: string;
    testId: string;
    totalScore: number | null;
    maxScore: number | null;
    severity: string | null;
    completedAt: Date | null;
  }>;
  llmCalls: Array<{ systemPrompt: string; userPayload: unknown }>;
  resolveLanguageCalls: Array<{
    studentId: string;
    testId: string;
    assignmentId: string | null;
  }>;
};

function makeBaselineFakes(): Fakes {
  return {
    reports: [],
    sessions: [
      {
        id: "sess-1",
        userId: "stu-1",
        testId: "test-1",
        assignmentId: null,
        totalScore: 12,
        maxScore: 27,
        severity: "moderate",
        completedAt: new Date("2026-04-25T08:00:00.000Z"),
      },
    ],
    tests: [
      {
        id: "test-1",
        slug: "phq-a",
        nameRu: "PHQ-A",
        description: "Депрессия (подростки)",
        questions: [
          {
            index: 0,
            textRu: "Как часто...",
            options: [
              { value: 0, labelRu: "Никогда" },
              { value: 3, labelRu: "Почти всегда" },
            ],
          },
        ],
      },
    ],
    answers: [
      { sessionId: "sess-1", questionIndex: 0, answer: 3, score: 3 },
    ],
    students: [
      { id: "stu-1", name: "Алия", grade: 9, classLetter: "Б" },
    ],
    history: [],
    llmCalls: [],
    resolveLanguageCalls: [],
  };
}

function makeService(opts?: {
  fakes?: Partial<Fakes>;
  llmResponse?: { content: string; tokensUsed: number | null } | null;
  llmError?: Error;
  language?: "ru" | "kz";
}) {
  const fakes: Fakes = { ...makeBaselineFakes(), ...(opts?.fakes ?? {}) };

  let nowCounter = 0;
  const fixedNow = new Date("2026-04-25T10:00:00.000Z");
  let idCounter = 0;

  const deps: AiReportServiceDeps = {
    findReportBySessionId: async (sessionId) =>
      fakes.reports.find((r) => r.sessionId === sessionId) ?? null,
    insertPendingReport: async (data) => {
      const row: PersistedReport = {
        id: data.id,
        sessionId: data.sessionId,
        status: "pending",
        model: null,
        summary: null,
        interpretation: null,
        riskFactors: null,
        recommendations: null,
        trend: null,
        flaggedItems: null,
        tokensUsed: null,
        errorMessage: null,
        generatedAt: null,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      };
      fakes.reports.push(row);
      return row;
    },
    updateReport: async (sessionId, fields) => {
      const r = fakes.reports.find((x) => x.sessionId === sessionId);
      if (!r) return null;
      Object.assign(r, fields, { updatedAt: fixedNow });
      return r;
    },
    findSessionById: async (id) =>
      fakes.sessions.find((s) => s.id === id) ?? null,
    findTestById: async (id) =>
      fakes.tests.find((t) => t.id === id) ?? null,
    findAnswersBySession: async (sessionId) =>
      fakes.answers
        .filter((a) => a.sessionId === sessionId)
        .sort((a, b) => a.questionIndex - b.questionIndex),
    findStudentById: async (id) =>
      fakes.students.find((s) => s.id === id) ?? null,
    findHistoryForUser: async (userId, testId, excludeSessionId) =>
      fakes.history
        .filter(
          (h) =>
            h.userId === userId &&
            h.testId === testId &&
            h.id !== excludeSessionId &&
            h.completedAt !== null,
        )
        .sort(
          (a, b) =>
            (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
        )
        .slice(0, 5),
    resolveReportLanguage: async (input) => {
      fakes.resolveLanguageCalls.push(input);
      return opts?.language ?? "ru";
    },
    callLLM: opts?.llmResponse === null
      ? null
      : async ({ systemPrompt, userPayload }) => {
          fakes.llmCalls.push({ systemPrompt, userPayload });
          if (opts?.llmError) throw opts.llmError;
          return (
            opts?.llmResponse ?? {
              content: JSON.stringify({
                summary: "default summary",
                interpretation: "default interpretation",
                riskFactors: [],
                recommendations: [],
                trend: null,
                flaggedItems: [],
              }),
              tokensUsed: 100,
            }
          );
        },
    newId: () => `report-${++idCounter}`,
    now: () => {
      nowCounter += 1;
      return fixedNow;
    },
  };

  return { service: createAiReportService(deps), fakes };
}

// ─── Report language resolver ────────────────────────────────────────

type ResolverFakes = {
  byAssignment: Record<string, string | null>;
  recentByTest: Record<string, string | null>;
  linkedByStudent: Record<string, string | null>;
  calls: {
    byAssignment: string[];
    recentByTest: Array<[string, string]>;
    linkedByStudent: string[];
  };
};

function makeResolver(seed: Partial<ResolverFakes> = {}) {
  const fakes: ResolverFakes = {
    byAssignment: { ...(seed.byAssignment ?? {}) },
    recentByTest: { ...(seed.recentByTest ?? {}) },
    linkedByStudent: { ...(seed.linkedByStudent ?? {}) },
    calls: { byAssignment: [], recentByTest: [], linkedByStudent: [] },
  };
  const deps: ReportLanguageResolverDeps = {
    findAssignmentLanguageById: async (id) => {
      fakes.calls.byAssignment.push(id);
      return fakes.byAssignment[id] ?? null;
    },
    findRecentTestAssignmentLanguage: async (studentId, testId) => {
      fakes.calls.recentByTest.push([studentId, testId]);
      return fakes.recentByTest[`${studentId}|${testId}`] ?? null;
    },
    findFirstLinkedPsychologistLanguage: async (studentId) => {
      fakes.calls.linkedByStudent.push(studentId);
      return fakes.linkedByStudent[studentId] ?? null;
    },
  };
  return { resolve: createReportLanguageResolver(deps), fakes };
}

test("resolver: when assignmentId is given and assigner has language, returns assigner's language", async () => {
  const { resolve, fakes } = makeResolver({
    byAssignment: { "asg-1": "kz" },
  });
  const lang = await resolve({
    studentId: "stu-1",
    testId: "test-1",
    assignmentId: "asg-1",
  });
  assert.equal(lang, "kz");
  assert.deepEqual(fakes.calls.byAssignment, ["asg-1"]);
  // Short-circuit: must NOT consult fallback lookups
  assert.deepEqual(fakes.calls.recentByTest, []);
  assert.deepEqual(fakes.calls.linkedByStudent, []);
});

test("resolver: when assignmentId is null, falls through to recent assignment of test", async () => {
  const { resolve, fakes } = makeResolver({
    recentByTest: { "stu-1|test-1": "kz" },
  });
  const lang = await resolve({
    studentId: "stu-1",
    testId: "test-1",
    assignmentId: null,
  });
  assert.equal(lang, "kz");
  assert.deepEqual(fakes.calls.recentByTest, [["stu-1", "test-1"]]);
  assert.deepEqual(fakes.calls.linkedByStudent, []);
});

test("resolver: when no assignment matches, falls back to first linked psychologist", async () => {
  const { resolve, fakes } = makeResolver({
    linkedByStudent: { "stu-1": "kz" },
  });
  const lang = await resolve({
    studentId: "stu-1",
    testId: "test-1",
    assignmentId: null,
  });
  assert.equal(lang, "kz");
  assert.deepEqual(fakes.calls.linkedByStudent, ["stu-1"]);
});

test("resolver: when nothing is found, defaults to ru", async () => {
  const { resolve } = makeResolver();
  const lang = await resolve({
    studentId: "stu-1",
    testId: "test-1",
    assignmentId: "asg-1",
  });
  assert.equal(lang, "ru");
});

test("resolver: normalizes unknown language values to ru", async () => {
  const { resolve } = makeResolver({
    byAssignment: { "asg-1": "en" },
  });
  const lang = await resolve({
    studentId: "stu-1",
    testId: "test-1",
    assignmentId: "asg-1",
  });
  assert.equal(lang, "ru");
});

test("resolver: assigner-of-this-assignment beats linked psychologist's language", async () => {
  const { resolve } = makeResolver({
    byAssignment: { "asg-1": "kz" },
    linkedByStudent: { "stu-1": "ru" },
  });
  const lang = await resolve({
    studentId: "stu-1",
    testId: "test-1",
    assignmentId: "asg-1",
  });
  assert.equal(lang, "kz");
});

// ─── Factory: language flow into LLM prompt ──────────────────────────

test("generateReport: passes session's studentId, testId, assignmentId to resolveReportLanguage", async () => {
  const { service, fakes } = makeService({
    fakes: {
      sessions: [
        {
          id: "sess-2",
          userId: "stu-2",
          testId: "test-2",
          assignmentId: "asg-2",
          totalScore: 5,
          maxScore: 10,
          severity: "low",
          completedAt: new Date("2026-04-25T08:00:00.000Z"),
        },
      ],
      tests: [
        {
          id: "test-2",
          slug: "gad-7",
          nameRu: "GAD-7",
          description: null,
          questions: [],
        },
      ],
      students: [{ id: "stu-2", name: "X", grade: 9, classLetter: "А" }],
    },
  });

  await service.generateReport("sess-2");

  assert.deepEqual(fakes.resolveLanguageCalls, [
    { studentId: "stu-2", testId: "test-2", assignmentId: "asg-2" },
  ]);
});

test("generateReport: when language is kz, callLLM receives Kazakh-directive system prompt", async () => {
  const { service, fakes } = makeService({ language: "kz" });
  await service.generateReport("sess-1");
  assert.equal(fakes.llmCalls.length, 1);
  assert.match(fakes.llmCalls[0].systemPrompt, /ҚАЗАҚ|қазақ/);
  assert.doesNotMatch(fakes.llmCalls[0].systemPrompt, /Пиши на РУССКОМ/);
});

test("generateReport: when language is ru, callLLM receives Russian-directive system prompt", async () => {
  const { service, fakes } = makeService({ language: "ru" });
  await service.generateReport("sess-1");
  assert.match(fakes.llmCalls[0].systemPrompt, /Пиши на РУССКОМ/);
});

test("generateReport: when callLLM is null (OPENAI_API_KEY missing), writes status=error with config message", async () => {
  const { service, fakes } = makeService({ llmResponse: null });
  await service.generateReport("sess-1");
  assert.equal(fakes.reports.length, 1);
  assert.equal(fakes.reports[0].status, "error");
  assert.equal(
    fakes.reports[0].errorMessage,
    "OPENAI_API_KEY is not configured",
  );
  assert.equal(fakes.llmCalls.length, 0);
});

test("generateReport: when callLLM throws, writes status=error with error message", async () => {
  const { service, fakes } = makeService({
    llmError: new Error("LLM upstream failure"),
  });
  await service.generateReport("sess-1");
  assert.equal(fakes.reports[0].status, "error");
  assert.equal(fakes.reports[0].errorMessage, "LLM upstream failure");
});

test("generateReport: when session not found, writes status=error", async () => {
  const { service, fakes } = makeService();
  await service.generateReport("missing-session");
  assert.equal(fakes.reports.length, 1);
  assert.equal(fakes.reports[0].status, "error");
  assert.match(fakes.reports[0].errorMessage ?? "", /Session not found/);
});

test("generateReport: when session is not completed, writes status=error", async () => {
  const { service, fakes } = makeService({
    fakes: {
      sessions: [
        {
          id: "sess-1",
          userId: "stu-1",
          testId: "test-1",
          assignmentId: null,
          totalScore: null,
          maxScore: null,
          severity: null,
          completedAt: null,
        },
      ],
    },
  });
  await service.generateReport("sess-1");
  assert.equal(fakes.reports[0].status, "error");
  assert.match(fakes.reports[0].errorMessage ?? "", /not completed/);
});

test("ensurePending: idempotent — second call does not create a duplicate row", async () => {
  const { service, fakes } = makeService();
  await service.ensurePending("sess-1");
  await service.ensurePending("sess-1");
  assert.equal(fakes.reports.length, 1);
  assert.equal(fakes.reports[0].status, "pending");
});

test("resetToPending: existing report is reset to pending and clears errorMessage", async () => {
  const { service, fakes } = makeService();
  await service.ensurePending("sess-1");
  // simulate prior error
  Object.assign(fakes.reports[0], { status: "error", errorMessage: "old" });
  await service.resetToPending("sess-1");
  assert.equal(fakes.reports[0].status, "pending");
  assert.equal(fakes.reports[0].errorMessage, null);
});

test("generateReport: writes status=ready with parsed LLM payload for completed session", async () => {
  const llmContent = JSON.stringify({
    summary: "Умеренные признаки депрессии",
    interpretation: "Балл 12/27 укладывается в умеренный диапазон.",
    riskFactors: [
      { factor: "Сон", severity: "moderate", evidence: "вопрос 3" },
    ],
    recommendations: [
      { type: "monitoring", text: "Повторить через 2 недели" },
    ],
    trend: null,
    flaggedItems: [],
  });

  const { service, fakes } = makeService({
    llmResponse: { content: llmContent, tokensUsed: 532 },
  });

  await service.generateReport("sess-1");

  assert.equal(fakes.reports.length, 1);
  const report = fakes.reports[0];
  assert.equal(report.sessionId, "sess-1");
  assert.equal(report.status, "ready");
  assert.equal(report.summary, "Умеренные признаки депрессии");
  assert.equal(
    report.interpretation,
    "Балл 12/27 укладывается в умеренный диапазон.",
  );
  assert.deepEqual(report.riskFactors, [
    { factor: "Сон", severity: "moderate", evidence: "вопрос 3" },
  ]);
  assert.deepEqual(report.recommendations, [
    { type: "monitoring", text: "Повторить через 2 недели" },
  ]);
  assert.equal(report.trend, null);
  assert.deepEqual(report.flaggedItems, []);
  assert.equal(report.tokensUsed, 532);
  assert.equal(report.errorMessage, null);
  assert.ok(report.generatedAt instanceof Date);
  assert.equal(fakes.llmCalls.length, 1);
});
