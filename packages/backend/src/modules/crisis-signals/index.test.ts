import { test } from "node:test";
import assert from "node:assert/strict";

import { createCrisisSignalsModule } from "./index.js";
import type {
  CrisisSignalsModuleDeps,
  CrisisSignalRow,
  PersistedCrisisSignal,
  ResolveInput,
} from "./index.js";

type Fakes = {
  signals: PersistedCrisisSignal[];
  rows: CrisisSignalRow[]; // enriched view (with student fields, resolution, linked psy)
  warnings: Array<{ msg: string; ctx?: Record<string, unknown> }>;
  studentLinks: Map<string, string[]>;
  studentInfo: Map<
    string,
    { name: string; grade: number | null; classLetter: string | null }
  >;
};

type ModuleOverrides = Partial<CrisisSignalsModuleDeps> & {
  studentLinks?: Record<string, string[]>;
  studentInfo?: Record<
    string,
    { name: string; grade: number | null; classLetter: string | null }
  >;
};

function makeModule(overrides: ModuleOverrides = {}) {
  const fakes: Fakes = {
    signals: [],
    rows: [],
    warnings: [],
    studentLinks: new Map(Object.entries(overrides.studentLinks ?? { "stu-1": ["psy-1"] })),
    studentInfo: new Map(
      Object.entries(
        overrides.studentInfo ?? {
          "stu-1": { name: "Иван Иванов", grade: 9, classLetter: "А" },
        },
      ),
    ),
  };
  let idCounter = 0;
  const deps: CrisisSignalsModuleDeps = {
    saveSignal: async (signal) => {
      fakes.signals.push(signal);
      const info = fakes.studentInfo.get(signal.studentId) ?? {
        name: "Unknown",
        grade: null,
        classLetter: null,
      };
      const linked = fakes.studentLinks.get(signal.studentId) ?? [];
      fakes.rows.push({
        id: signal.id,
        studentId: signal.studentId,
        studentName: info.name,
        studentGrade: info.grade,
        studentClassLetter: info.classLetter,
        type: signal.type,
        severity: signal.severity,
        source: signal.source,
        summary: signal.summary,
        metadata: signal.metadata,
        createdAt: signal.createdAt,
        resolvedAt: null,
        resolvedBy: null,
        resolutionNotes: null,
        contactedStudent: false,
        contactedParent: false,
        documented: false,
        linkedPsychologistIds: linked,
      });
      return signal.id;
    },
    findPsychologistIdsForStudent: async (studentId) =>
      fakes.studentLinks.get(studentId) ?? [],
    findActiveByPsychologistAndType: async (psychologistId, type) =>
      fakes.rows
        .filter(
          (r) =>
            r.linkedPsychologistIds.includes(psychologistId) &&
            r.type === type &&
            r.resolvedAt === null,
        )
        .map((r) => ({ ...r })),
    findHistoryByPsychologist: async (psychologistId) =>
      fakes.rows
        .filter(
          (r) =>
            r.linkedPsychologistIds.includes(psychologistId) &&
            r.resolvedAt !== null,
        )
        .map((r) => ({ ...r })),
    findById: async (id, psychologistId) => {
      const row = fakes.rows.find(
        (r) =>
          r.id === id && r.linkedPsychologistIds.includes(psychologistId),
      );
      return row ? { ...row } : null;
    },
    resolveSignal: async (id, input: ResolveInput) => {
      const row = fakes.rows.find((r) => r.id === id);
      if (!row) throw new Error("not found in fake");
      row.resolvedAt = input.resolvedAt;
      row.resolvedBy = input.resolvedBy;
      row.resolutionNotes = input.notes;
      row.contactedStudent = input.contactedStudent;
      row.contactedParent = input.contactedParent;
      row.documented = input.documented;
      return { ...row };
    },
    logger: { warn: (msg, ctx) => fakes.warnings.push({ msg, ctx }) },
    now: () => new Date("2026-04-26T10:00:00.000Z"),
    newId: () => `id-${++idCounter}`,
    ...overrides,
  };
  return { module: createCrisisSignalsModule(deps), fakes };
}

test("report → dispatchPush вызывается для каждого linked психолога", async () => {
  const dispatched: Array<{
    recipientPsychologistId: string;
    severity: string;
    type: string;
  }> = [];

  const { module } = makeModule({
    studentLinks: { "stu-1": ["psy-1", "psy-2"] },
    dispatchPush: async ({ recipientPsychologistId, signal }) => {
      dispatched.push({
        recipientPsychologistId,
        severity: signal.severity,
        type: signal.type,
      });
    },
    findStudentName: async () => "Иван Иванов",
  });

  await module.report({
    source: "urgent_help",
    userId: "stu-1",
    metadata: { sosEventId: "sos-1" },
  });

  assert.equal(dispatched.length, 2);
  assert.deepEqual(
    dispatched.map((d) => d.recipientPsychologistId).sort(),
    ["psy-1", "psy-2"],
  );
  assert.equal(dispatched[0]!.severity, "high");
  assert.equal(dispatched[0]!.type, "acute_crisis");
});

test("report без linked психологов → dispatchPush НЕ вызывается, логируется warn", async () => {
  let dispatchCalled = false;
  const { module, fakes } = makeModule({
    studentLinks: { "stu-orphan": [] },
    dispatchPush: async () => {
      dispatchCalled = true;
    },
  });

  await module.report({
    source: "urgent_help",
    userId: "stu-orphan",
  });

  assert.equal(dispatchCalled, false);
  assert.ok(fakes.warnings.some((w) => /no linked psychologist/i.test(w.msg)));
});

test("report → если dispatchPush бросает ошибку, signal всё равно создан", async () => {
  const { module, fakes } = makeModule({
    studentLinks: { "stu-1": ["psy-1"] },
    dispatchPush: async () => {
      throw new Error("expo down");
    },
  });

  const signal = await module.report({
    source: "urgent_help",
    userId: "stu-1",
  });

  assert.equal(fakes.signals.length, 1);
  assert.equal(fakes.signals[0]!.id, signal.id);
  assert.ok(fakes.warnings.some((w) => /Push dispatch failed/i.test(w.msg)));
});

test("report ai_friend acute_crisis → persists signal", async () => {
  const { module, fakes } = makeModule();

  const signal = await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "sess-1",
    type: "acute_crisis",
    severity: "high",
    summary: "Ученик выразил суицидальные мысли в чате с AI-Friend",
    markers: ["безнадёжность"],
  });

  assert.equal(signal.type, "acute_crisis");
  assert.equal(signal.severity, "high");
  assert.equal(signal.source, "ai_friend");
  assert.equal(signal.studentId, "stu-1");
  assert.equal(signal.summary, "Ученик выразил суицидальные мысли в чате с AI-Friend");
  assert.deepEqual(signal.createdAt, new Date("2026-04-26T10:00:00.000Z"));

  assert.equal(fakes.signals.length, 1);
  assert.equal(fakes.signals[0].id, signal.id);
});

test("BOUNDARY: ai_friend report → signal appears in psychologist Red Feed", async () => {
  const { module } = makeModule();

  const reported = await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "sess-1",
    type: "acute_crisis",
    severity: "high",
    summary: "Ученик выразил суицидальные мысли",
    category: "self_esteem",
  });

  const redFeed = await module.feedFor("psy-1", { feed: "red" });

  assert.equal(redFeed.length, 1);
  assert.equal(redFeed[0].id, reported.id);
  assert.equal(redFeed[0].type, "acute_crisis");
  assert.equal(redFeed[0].source, "ai_friend");
  assert.equal(redFeed[0].studentId, "stu-1");
  assert.equal(redFeed[0].studentName, "Иван Иванов");
});

test("BOUNDARY: urgent_help report → appears in Red Feed", async () => {
  const { module } = makeModule();

  await module.report({ source: "urgent_help", userId: "stu-1" });

  const redFeed = await module.feedFor("psy-1", { feed: "red" });

  assert.equal(redFeed.length, 1);
  assert.equal(redFeed[0].source, "urgent_help");
  assert.equal(redFeed[0].type, "acute_crisis");
});

test("BOUNDARY: test_session severe report → appears in Red Feed", async () => {
  const { module } = makeModule();

  await module.report({
    source: "test_session",
    userId: "stu-1",
    testSessionId: "sess-42",
    testSlug: "phq-a",
    testSeverity: "severe",
    flaggedItems: [{ questionIndex: 9, reason: "suicidal_ideation" }],
  });

  const redFeed = await module.feedFor("psy-1", { feed: "red" });

  assert.equal(redFeed.length, 1);
  assert.equal(redFeed[0].source, "test_session");
  assert.equal(redFeed[0].type, "acute_crisis");
});

test("BOUNDARY: ai_friend concern report → appears in Yellow Feed not Red", async () => {
  const { module } = makeModule();

  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "sess-1",
    type: "concern",
    severity: "medium",
    summary: "Систематический буллинг со стороны одноклассников",
    category: "bullying",
  });

  const red = await module.feedFor("psy-1", { feed: "red" });
  const yellow = await module.feedFor("psy-1", { feed: "yellow" });

  assert.equal(red.length, 0);
  assert.equal(yellow.length, 1);
  assert.equal(yellow[0].type, "concern");
});

test("feedFor excludes signals from other psychologists' students", async () => {
  const { module } = makeModule({
    studentLinks: { "stu-1": ["psy-1"], "stu-2": ["psy-2"] },
    studentInfo: {
      "stu-1": { name: "A", grade: 9, classLetter: "А" },
      "stu-2": { name: "B", grade: 9, classLetter: "Б" },
    },
  });

  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "x",
    type: "acute_crisis",
    severity: "high",
    summary: "mine",
  });
  await module.report({
    source: "ai_friend",
    userId: "stu-2",
    conversationId: "x",
    type: "acute_crisis",
    severity: "high",
    summary: "not mine",
  });

  const feed = await module.feedFor("psy-1", { feed: "red" });
  assert.equal(feed.length, 1);
  assert.equal(feed[0].studentId, "stu-1");
});

test("feedFor red sorts by createdAt desc", async () => {
  let now = new Date("2026-04-26T08:00:00.000Z");
  const { module } = makeModule({ now: () => now });

  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "x",
    type: "acute_crisis",
    severity: "high",
    summary: "older",
  });
  now = new Date("2026-04-26T11:00:00.000Z");
  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "x",
    type: "acute_crisis",
    severity: "high",
    summary: "newer",
  });

  const feed = await module.feedFor("psy-1", { feed: "red" });
  assert.equal(feed[0].summary, "newer");
  assert.equal(feed[1].summary, "older");
});

test("feedFor yellow sorts by severity desc then createdAt desc", async () => {
  let now = new Date("2026-04-26T07:00:00.000Z");
  const { module } = makeModule({ now: () => now });

  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "x",
    type: "concern",
    severity: "low",
    summary: "low-old",
  });
  now = new Date("2026-04-26T08:00:00.000Z");
  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "x",
    type: "concern",
    severity: "high",
    summary: "high-old",
  });
  now = new Date("2026-04-26T10:00:00.000Z");
  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "x",
    type: "concern",
    severity: "high",
    summary: "high-new",
  });
  now = new Date("2026-04-26T11:00:00.000Z");
  await module.report({
    source: "ai_friend",
    userId: "stu-1",
    conversationId: "x",
    type: "concern",
    severity: "medium",
    summary: "medium-new",
  });

  const feed = await module.feedFor("psy-1", { feed: "yellow" });
  assert.deepEqual(
    feed.map((r) => r.summary),
    ["high-new", "high-old", "medium-new", "low-old"],
  );
});

test("resolve marks signal and removes from active feed", async () => {
  const { module } = makeModule();

  const sig = await module.report({
    source: "urgent_help",
    userId: "stu-1",
  });

  await module.resolve("psy-1", sig.id, {
    notes: "Связалась с учеником, всё стабилизировано.",
    contactedStudent: true,
    contactedParent: false,
    documented: true,
  });

  const feed = await module.feedFor("psy-1", { feed: "red" });
  assert.equal(feed.length, 0);
});

test("resolve throws ValidationError when already resolved", async () => {
  const { module } = makeModule();

  const sig = await module.report({ source: "urgent_help", userId: "stu-1" });
  await module.resolve("psy-1", sig.id, {});

  await assert.rejects(
    () => module.resolve("psy-1", sig.id, {}),
    (err: Error) => err.name === "ValidationError",
  );
});

test("resolve throws NotFoundError for missing or other-psy signal", async () => {
  const { module } = makeModule({
    studentLinks: { "stu-1": ["psy-1"], "stu-2": ["psy-2"] },
    studentInfo: {
      "stu-1": { name: "A", grade: 9, classLetter: "А" },
      "stu-2": { name: "B", grade: 9, classLetter: "Б" },
    },
  });

  await assert.rejects(
    () => module.resolve("psy-1", "missing-id", {}),
    (err: Error) => err.name === "NotFoundError",
  );

  const otherSig = await module.report({ source: "urgent_help", userId: "stu-2" });
  await assert.rejects(
    () => module.resolve("psy-1", otherSig.id, {}),
    (err: Error) => err.name === "NotFoundError",
  );
});

test("warns when student has no linked psychologist but still persists signal", async () => {
  const { module, fakes } = makeModule({
    studentLinks: { "stu-orphan": [] },
    studentInfo: { "stu-orphan": { name: "O", grade: 8, classLetter: "А" } },
  });

  const sig = await module.report({ source: "urgent_help", userId: "stu-orphan" });

  assert.equal(fakes.signals.length, 1);
  assert.equal(fakes.warnings.length, 1);
  assert.equal(fakes.warnings[0].ctx?.studentId, "stu-orphan");
  assert.equal(fakes.warnings[0].ctx?.signalId, sig.id);
});

test("report urgent_help → type=acute_crisis severity=high regardless of input", async () => {
  const { module } = makeModule();

  const signal = await module.report({
    source: "urgent_help",
    userId: "stu-1",
  });

  assert.equal(signal.type, "acute_crisis");
  assert.equal(signal.severity, "high");
  assert.equal(signal.source, "urgent_help");
  assert.equal(signal.studentId, "stu-1");
  assert.equal(typeof signal.summary, "string");
  assert.ok(signal.summary.length > 0, "summary must be non-empty");
});

test("report urgent_help preserves provided metadata verbatim on signal", async () => {
  const { module, fakes } = makeModule();
  const metadata = { triggeredFrom: "sos_screen", clientVersion: "1.4.2" };

  await module.report({ source: "urgent_help", userId: "stu-1", metadata });

  assert.deepEqual(fakes.signals[0].metadata, metadata);
});

test("report test_session severe → type=acute_crisis severity=high with test metadata", async () => {
  const { module } = makeModule();

  const signal = await module.report({
    source: "test_session",
    userId: "stu-1",
    testSessionId: "sess-42",
    testSlug: "phq-a",
    testSeverity: "severe",
    flaggedItems: [
      { questionIndex: 9, reason: "suicidal_ideation" },
    ],
  });

  assert.equal(signal.type, "acute_crisis");
  assert.equal(signal.severity, "high");
  assert.equal(signal.source, "test_session");
  assert.deepEqual(signal.metadata, {
    testSessionId: "sess-42",
    testSlug: "phq-a",
    testSeverity: "severe",
    flaggedItems: [{ questionIndex: 9, reason: "suicidal_ideation" }],
  });
});
