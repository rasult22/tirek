import { test } from "node:test";
import assert from "node:assert/strict";

import { createTimelineModule } from "./timeline.js";
import type { TimelineEvent, TimelineModuleDeps } from "./timeline.js";

type Overrides = Partial<TimelineModuleDeps>;

function makeModule(overrides: Overrides = {}) {
  const deps: TimelineModuleDeps = {
    isStudentLinked: async () => true,
    findMoodEvents: async () => [],
    findTestEvents: async () => [],
    findCbtEvents: async () => [],
    findMessageEvents: async () => [],
    findCrisisEvents: async () => [],
    ...overrides,
  };
  return createTimelineModule(deps);
}

test("authorization: unlinked student → NotFoundError", async () => {
  const module = makeModule({
    isStudentLinked: async () => false,
  });

  await assert.rejects(
    () => module.getStudentTimeline("psy-1", "stu-1", { limit: 20, offset: 0 }),
    (err: Error) => err.name === "NotFoundError",
  );
});

test("merge: mood + test events interleaved DESC across sources", async () => {
  const module = makeModule({
    findMoodEvents: async () => [
      {
        id: "m1",
        type: "mood",
        occurredAt: new Date("2026-04-26T10:00:00.000Z"),
        payload: { mood: 4, note: null },
      },
      {
        id: "m2",
        type: "mood",
        occurredAt: new Date("2026-04-24T10:00:00.000Z"),
        payload: { mood: 2, note: null },
      },
    ],
    findTestEvents: async () => [
      {
        id: "t1",
        type: "test",
        occurredAt: new Date("2026-04-25T10:00:00.000Z"),
        payload: {
          sessionId: "s1",
          testSlug: "phq-a",
          testName: "PHQ-A",
          severity: "minimal",
        },
      },
    ],
  });

  const { data } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
  });

  assert.deepEqual(
    data.map((e) => e.id),
    ["m1", "t1", "m2"],
  );
});

test("filter type=mood: returns only mood events even when test events exist", async () => {
  const module = makeModule({
    findMoodEvents: async () => [
      {
        id: "m1",
        type: "mood",
        occurredAt: new Date("2026-04-26T10:00:00.000Z"),
        payload: { mood: 4, note: null },
      },
    ],
    findTestEvents: async () => [
      {
        id: "t1",
        type: "test",
        occurredAt: new Date("2026-04-27T10:00:00.000Z"),
        payload: {
          sessionId: "s1",
          testSlug: "phq-a",
          testName: "PHQ-A",
          severity: "minimal",
        },
      },
    ],
  });

  const { data, total } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
    type: "mood",
  });

  assert.equal(total, 1);
  assert.equal(data.length, 1);
  assert.equal(data[0].id, "m1");
  assert.equal(data[0].type, "mood");
});

test("filter type=test: returns only test events", async () => {
  const module = makeModule({
    findMoodEvents: async () => [
      {
        id: "m1",
        type: "mood",
        occurredAt: new Date("2026-04-27T10:00:00.000Z"),
        payload: { mood: 4, note: null },
      },
    ],
    findTestEvents: async () => [
      {
        id: "t1",
        type: "test",
        occurredAt: new Date("2026-04-26T10:00:00.000Z"),
        payload: {
          sessionId: "s1",
          testSlug: "phq-a",
          testName: "PHQ-A",
          severity: "minimal",
        },
      },
    ],
  });

  const { data } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
    type: "test",
  });

  assert.equal(data.length, 1);
  assert.equal(data[0].id, "t1");
  assert.equal(data[0].type, "test");
});

test("filter type=cbt: returns only cbt events", async () => {
  const module = makeModule({
    findCbtEvents: async () => [
      {
        id: "c1",
        type: "cbt",
        occurredAt: new Date("2026-04-26T10:00:00.000Z"),
        payload: { cbtType: "thought_diary", summary: "Тревога перед уроком" },
      },
    ],
  });

  const { data } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
    type: "cbt",
  });

  assert.equal(data.length, 1);
  assert.equal(data[0].id, "c1");
  assert.equal(data[0].type, "cbt");
});

test("filter type=message: returns messages with direction", async () => {
  const module = makeModule({
    findMessageEvents: async () => [
      {
        id: "msg-1",
        type: "message",
        occurredAt: new Date("2026-04-26T10:00:00.000Z"),
        payload: { direction: "from_student", preview: "Здравствуйте" },
      },
      {
        id: "msg-2",
        type: "message",
        occurredAt: new Date("2026-04-26T11:00:00.000Z"),
        payload: { direction: "from_psychologist", preview: "Привет!" },
      },
    ],
  });

  const { data } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
    type: "message",
  });

  assert.equal(data.length, 2);
  assert.equal(data[0].id, "msg-2"); // newer first
  if (data[0].type !== "message") return;
  assert.equal(data[0].payload.direction, "from_psychologist");
  if (data[1].type !== "message") return;
  assert.equal(data[1].payload.direction, "from_student");
});

test("crisis events expose only summary, not raw text", async () => {
  const module = makeModule({
    findCrisisEvents: async () => [
      {
        id: "crisis-1",
        type: "crisis",
        occurredAt: new Date("2026-04-26T10:00:00.000Z"),
        payload: {
          signalType: "acute_crisis",
          severity: "high",
          summary: "Сильное эмоциональное состояние",
        },
      },
    ],
  });

  const { data } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
    type: "crisis",
  });

  assert.equal(data.length, 1);
  assert.equal(data[0].type, "crisis");
  if (data[0].type !== "crisis") return;
  // payload должен содержать только safe-поля; raw_text/markers — не expose
  assert.deepEqual(Object.keys(data[0].payload).sort(), [
    "severity",
    "signalType",
    "summary",
  ]);
});

test("merge: all five sources interleaved DESC", async () => {
  const module = makeModule({
    findMoodEvents: async () => [
      {
        id: "m1",
        type: "mood",
        occurredAt: new Date("2026-04-20T10:00:00.000Z"),
        payload: { mood: 3, note: null },
      },
    ],
    findTestEvents: async () => [
      {
        id: "t1",
        type: "test",
        occurredAt: new Date("2026-04-21T10:00:00.000Z"),
        payload: { sessionId: "s1", testSlug: "phq-a", testName: "PHQ-A", severity: "minimal" },
      },
    ],
    findCbtEvents: async () => [
      {
        id: "c1",
        type: "cbt",
        occurredAt: new Date("2026-04-22T10:00:00.000Z"),
        payload: { cbtType: "thought_diary", summary: "x" },
      },
    ],
    findMessageEvents: async () => [
      {
        id: "msg-1",
        type: "message",
        occurredAt: new Date("2026-04-23T10:00:00.000Z"),
        payload: { direction: "from_student", preview: "p" },
      },
    ],
    findCrisisEvents: async () => [
      {
        id: "crisis-1",
        type: "crisis",
        occurredAt: new Date("2026-04-24T10:00:00.000Z"),
        payload: { signalType: "acute_crisis", severity: "high", summary: "s" },
      },
    ],
  });

  const { data, total } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
  });

  assert.equal(total, 5);
  assert.deepEqual(
    data.map((e) => e.id),
    ["crisis-1", "msg-1", "c1", "t1", "m1"],
  );
});

test("pagination: limit + offset slice without overlap, total reflects all", async () => {
  const dates = [
    "2026-04-26T10:00:00.000Z",
    "2026-04-25T10:00:00.000Z",
    "2026-04-24T10:00:00.000Z",
    "2026-04-23T10:00:00.000Z",
    "2026-04-22T10:00:00.000Z",
  ];
  const moodEvents: TimelineEvent[] = dates.map((d, i) => ({
    id: `m${i}`,
    type: "mood",
    occurredAt: new Date(d),
    payload: { mood: 3, note: null },
  }));
  const module = makeModule({
    findMoodEvents: async () => moodEvents,
  });

  const page1 = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 2,
    offset: 0,
  });
  const page2 = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 2,
    offset: 2,
  });

  assert.equal(page1.total, 5);
  assert.equal(page2.total, 5);

  assert.deepEqual(
    page1.data.map((e) => e.id),
    ["m0", "m1"],
  );
  assert.deepEqual(
    page2.data.map((e) => e.id),
    ["m2", "m3"],
  );
});

test("mood: returns student's mood entries sorted DESC by occurredAt", async () => {
  const module = makeModule({
    findMoodEvents: async (studentId) => {
      assert.equal(studentId, "stu-1");
      return [
        {
          id: "m-old",
          type: "mood",
          occurredAt: new Date("2026-04-26T08:00:00.000Z"),
          payload: { mood: 3, note: null },
        },
        {
          id: "m-new",
          type: "mood",
          occurredAt: new Date("2026-04-26T20:00:00.000Z"),
          payload: { mood: 4, note: "ok" },
        },
      ];
    },
  });

  const { data, total } = await module.getStudentTimeline("psy-1", "stu-1", {
    limit: 20,
    offset: 0,
  });

  assert.equal(total, 2);
  assert.equal(data.length, 2);
  assert.equal(data[0].id, "m-new");
  assert.equal(data[1].id, "m-old");
  assert.equal(data[0].type, "mood");
});
