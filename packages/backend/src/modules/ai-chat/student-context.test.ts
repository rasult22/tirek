import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createStudentContext,
  type StudentContextDeps,
} from "./student-context.js";

type Fakes = {
  loadCalls: Array<{ userId: string }>;
  user: {
    name: string;
    grade: number | null;
    classLetter: string | null;
    language: string;
  } | null;
  recentMoods: Array<{
    mood: number;
    stressLevel: number | null;
    sleepQuality: number | null;
    createdAt: Date;
  }>;
  recentTests: Array<{
    testName: string;
    completedAt: Date | null;
    totalScore?: number | null;
    maxScore?: number | null;
    severity?: string | null;
  }>;
};

function makeContext(initial?: Partial<Fakes>) {
  const fakes: Fakes = {
    loadCalls: [],
    user: { name: "Айдана", grade: 8, classLetter: "Б", language: "ru" },
    recentMoods: [],
    recentTests: [],
    ...initial,
  };

  const deps: StudentContextDeps = {
    loadStudentData: async (userId) => {
      fakes.loadCalls.push({ userId });
      return {
        user: fakes.user,
        recentMoods: fakes.recentMoods,
        recentTests: fakes.recentTests,
      };
    },
  };

  return { studentContext: createStudentContext(deps), fakes };
}

test("5 messages in one session → loadStudentData called exactly once", async () => {
  const { studentContext, fakes } = makeContext();

  for (let i = 0; i < 5; i++) {
    await studentContext.getOrBuild("user-1", "session-1");
  }

  assert.equal(fakes.loadCalls.length, 1);
});

test("diagnostic test scores and severity never leak into prompt", async () => {
  const { studentContext } = makeContext({
    recentTests: [
      {
        testName: "PHQ-9 для подростков",
        completedAt: new Date("2026-04-20T12:30:00.000Z"),
        totalScore: 22,
        maxScore: 27,
        severity: "severe",
      },
    ],
  });

  const snap = await studentContext.getOrBuild("user-1", "session-1");

  assert.match(snap.prompt, /PHQ-9 для подростков/);
  assert.ok(!snap.prompt.includes("22"), `score 22 leaked: ${snap.prompt}`);
  assert.ok(!snap.prompt.includes("27"), `maxScore 27 leaked: ${snap.prompt}`);
  assert.ok(!/severe/i.test(snap.prompt), `severity leaked: ${snap.prompt}`);
});

test("snapshot.language reflects user.language; profile change visible only after invalidate", async () => {
  const { studentContext, fakes } = makeContext({
    user: { name: "Айдана", grade: 8, classLetter: "Б", language: "ru" },
  });

  const first = await studentContext.getOrBuild("user-1", "session-1");
  assert.equal(first.language, "ru");

  // User updates profile to kz mid-session — without invalidate, snapshot stays consistent.
  fakes.user = { name: "Айдана", grade: 8, classLetter: "Б", language: "kz" };

  const stillRu = await studentContext.getOrBuild("user-1", "session-1");
  assert.equal(stillRu.language, "ru");

  studentContext.invalidate("user-1");

  const afterInvalidate = await studentContext.getOrBuild("user-1", "session-1");
  assert.equal(afterInvalidate.language, "kz");
  assert.match(afterInvalidate.prompt, /казахский/);
});

test("after invalidate(userId), next getOrBuild sees fresh mood data", async () => {
  const { studentContext, fakes } = makeContext({
    recentMoods: [
      {
        mood: 2,
        stressLevel: null,
        sleepQuality: null,
        createdAt: new Date("2026-04-25T10:00:00.000Z"),
      },
    ],
  });

  const before = await studentContext.getOrBuild("user-1", "session-1");
  assert.match(before.prompt, /среднее 2/);

  fakes.recentMoods.push({
    mood: 5,
    stressLevel: null,
    sleepQuality: null,
    createdAt: new Date("2026-04-26T10:00:00.000Z"),
  });

  // Without invalidate: still cached.
  const stillCached = await studentContext.getOrBuild("user-1", "session-1");
  assert.equal(stillCached.prompt, before.prompt);
  assert.equal(fakes.loadCalls.length, 1);

  studentContext.invalidate("user-1");

  const after = await studentContext.getOrBuild("user-1", "session-1");
  assert.match(after.prompt, /среднее 3\.5/);
  assert.equal(fakes.loadCalls.length, 2);
});
