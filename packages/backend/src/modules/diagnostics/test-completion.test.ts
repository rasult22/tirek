import { test } from "node:test";
import assert from "node:assert/strict";

import { createTestCompletion } from "./test-completion.js";
import type {
  TestCompletionDeps,
  CompletedSession,
  TestForCompletion,
  TestAnswerForCompletion,
} from "./test-completion.js";
import type { Severity } from "./test-scoring-engine.js";
import type { CrisisSignalInput } from "../crisis-signals/index.js";

type Fakes = {
  reportedSignals: CrisisSignalInput[];
  ensuredPending: string[];
  scheduled: string[];
  productiveActions: Array<{ userId: string; kind: string }>;
  warnings: Array<{ msg: string; ctx?: Record<string, unknown> }>;
};

interface MakeOptions {
  severity?: Severity;
  flaggedItems?: Array<{ questionIndex: number; answer: number; reason: string }>;
  aiAvailable?: boolean;
  reportThrows?: boolean;
}

function makeHandler(opts: MakeOptions = {}) {
  const fakes: Fakes = {
    reportedSignals: [],
    ensuredPending: [],
    scheduled: [],
    productiveActions: [],
    warnings: [],
  };

  const session: CompletedSession = {
    id: "sess-1",
    userId: "stu-1",
    testId: "test-1",
    completedAt: new Date("2026-04-26T10:00:00.000Z"),
    totalScore: 5,
    maxScore: 27,
    severity: opts.severity ?? "minimal",
    flaggedItems: opts.flaggedItems ?? [],
  };

  const test: TestForCompletion = {
    id: "test-1",
    slug: "phq-a",
  };

  const answers: TestAnswerForCompletion[] = [
    { questionIndex: 0, answer: 0 },
  ];

  const deps: TestCompletionDeps = {
    completeSession: async () => session,
    findTestById: async () => test,
    findAnswersBySession: async () => answers,
    reportCrisisSignal: async (signal) => {
      if (opts.reportThrows) throw new Error("crisis pipeline down");
      fakes.reportedSignals.push(signal);
    },
    ensureAiReportPending: async (sessionId) => {
      fakes.ensuredPending.push(sessionId);
    },
    scheduleAiReportGeneration: (sessionId) => {
      fakes.scheduled.push(sessionId);
    },
    isAiReportAvailable: () => opts.aiAvailable ?? true,
    recordProductiveAction: async (userId, kind) => {
      fakes.productiveActions.push({ userId, kind });
    },
    logger: {
      warn: (msg, ctx) => fakes.warnings.push({ msg, ctx }),
    },
  };

  return { handler: createTestCompletion(deps), fakes };
}

test("minimal severity → suggestedActions = NORMAL_ACTIONS, crisis NOT reported", async () => {
  const { handler, fakes } = makeHandler({ severity: "minimal" });

  const response = await handler.handle({
    userId: "stu-1",
    sessionId: "sess-1",
  });

  assert.equal(response.completed, true);
  assert.equal(response.sessionId, "sess-1");
  assert.equal(response.severity, "minimal");
  assert.equal(response.requiresSupport, false);
  assert.equal(response.aiReportStatus, "pending");

  // нормальные действия — без чата с психологом и без hotline
  const actionTypes = response.suggestedActions.map((a) => a.type);
  assert.ok(actionTypes.includes("exercise"));
  assert.ok(actionTypes.includes("journal"));
  assert.ok(!actionTypes.includes("chat"));
  assert.ok(!actionTypes.includes("hotline"));

  // crisis signal не должен быть отправлен
  assert.equal(fakes.reportedSignals.length, 0);
});

test("moderate severity → suggestedActions содержат soft-escalation tip, crisis NOT reported", async () => {
  const { handler, fakes } = makeHandler({ severity: "moderate" });

  const response = await handler.handle({
    userId: "stu-1",
    sessionId: "sess-1",
  });

  assert.equal(response.severity, "moderate");
  // soft-escalation должен предложить чат с психологом и hotline
  const actionTypes = response.suggestedActions.map((a) => a.type);
  assert.ok(
    actionTypes.includes("chat"),
    "moderate severity must include 'chat' action",
  );
  assert.ok(
    actionTypes.includes("hotline"),
    "moderate severity must include 'hotline' action",
  );

  // но crisis signal НЕ создаётся — это soft escalation, не острый кризис
  assert.equal(fakes.reportedSignals.length, 0);
  // requiresSupport остаётся false, поскольку психологу не нужно срочное уведомление
  assert.equal(response.requiresSupport, false);
});

test("severe severity → crisis signal reported with source='test_session' and testSeverity='severe'", async () => {
  const flagged = [
    { questionIndex: 8, answer: 2, reason: "suicidal_ideation" },
  ];
  const { handler, fakes } = makeHandler({
    severity: "severe",
    flaggedItems: flagged,
  });

  const response = await handler.handle({
    userId: "stu-1",
    sessionId: "sess-1",
  });

  assert.equal(response.severity, "severe");
  assert.equal(response.requiresSupport, true);

  // ровно один crisis signal, типизированный для test_session
  assert.equal(fakes.reportedSignals.length, 1);
  const signal = fakes.reportedSignals[0];
  assert.equal(signal.source, "test_session");
  if (signal.source !== "test_session") return; // narrowing для TS
  assert.equal(signal.userId, "stu-1");
  assert.equal(signal.testSessionId, "sess-1");
  assert.equal(signal.testSlug, "phq-a");
  assert.equal(signal.testSeverity, "severe");
  assert.deepEqual(signal.flaggedItems, flagged);
});

test("AI report unavailable → aiReportStatus='failed', generation NOT scheduled, handler doesn't crash", async () => {
  const { handler, fakes } = makeHandler({
    severity: "minimal",
    aiAvailable: false,
  });

  const response = await handler.handle({
    userId: "stu-1",
    sessionId: "sess-1",
  });

  // основной flow корректно завершился
  assert.equal(response.completed, true);
  assert.equal(response.severity, "minimal");
  assert.equal(response.aiReportStatus, "failed");

  // ни ensure, ни schedule не должны быть вызваны, если LLM недоступен
  assert.equal(fakes.scheduled.length, 0);
  assert.equal(fakes.ensuredPending.length, 0);
});

test("AI report available → aiReportStatus='pending', ensure+schedule called once", async () => {
  const { handler, fakes } = makeHandler({
    severity: "minimal",
    aiAvailable: true,
  });

  const response = await handler.handle({
    userId: "stu-1",
    sessionId: "sess-1",
  });

  assert.equal(response.aiReportStatus, "pending");
  assert.deepEqual(fakes.ensuredPending, ["sess-1"]);
  assert.deepEqual(fakes.scheduled, ["sess-1"]);
});

test("flagged items + non-severe severity → crisis signal still reported (safety override)", async () => {
  const flagged = [
    { questionIndex: 8, answer: 1, reason: "suicidal_ideation" },
  ];
  const { handler, fakes } = makeHandler({
    severity: "mild",
    flaggedItems: flagged,
  });

  const response = await handler.handle({
    userId: "stu-1",
    sessionId: "sess-1",
  });

  // безопасность важнее severity — даже при mild флаг должен эскалировать
  assert.equal(response.requiresSupport, true);
  assert.equal(fakes.reportedSignals.length, 1);
  const signal = fakes.reportedSignals[0];
  assert.equal(signal.source, "test_session");
  if (signal.source !== "test_session") return;
  assert.deepEqual(signal.flaggedItems, flagged);
});

test("crisis routing throws → handler still returns successful response, warning logged", async () => {
  const { handler, fakes } = makeHandler({
    severity: "severe",
    reportThrows: true,
  });

  const response = await handler.handle({
    userId: "stu-1",
    sessionId: "sess-1",
  });

  // основной flow не должен падать — student всё равно увидит результат
  assert.equal(response.completed, true);
  assert.equal(response.severity, "severe");
  assert.equal(response.requiresSupport, true);

  // но warning должен быть залогирован — иначе сбой невидим
  assert.ok(
    fakes.warnings.some((w) => w.msg.includes("crisis")),
    "expected crisis routing warning",
  );
});
