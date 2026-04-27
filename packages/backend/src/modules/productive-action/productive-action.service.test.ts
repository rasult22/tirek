import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createProductiveActionService,
  type ProductiveActionDeps,
} from "./productive-action.service.js";
import type { AchievementContext } from "../../lib/achievement-checker/achievement-checker.js";

type Fakes = {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    freezesAvailable: number;
    freezeUsedDate: string | null;
  } | null;
  plant: { growthPoints: number } | null;
  awardedSlugs: Set<string>;
};

type Overrides = {
  currentDay?: string;
  // Lets tests advance the calendar between calls.
  currentDayProvider?: () => string;
  // Mood/exercise/etc counts that drive achievement-checker conditions.
  contextOverrides?: Partial<AchievementContext>;
  // Force a specific dep to throw — used in transaction-rollback test.
  failOn?: "upsertStreak" | "upsertPlant" | "awardAchievement";
};

function makeService(overrides: Overrides = {}) {
  const fakes: Fakes = {
    streak: null,
    plant: null,
    awardedSlugs: new Set(),
  };

  const deps: ProductiveActionDeps = {
    getStreak: async () => fakes.streak,
    getPlant: async () => fakes.plant,
    upsertStreak: async (_tx, _userId, data) => {
      if (overrides.failOn === "upsertStreak") {
        throw new Error("simulated upsertStreak failure");
      }
      fakes.streak = {
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastActiveDate: data.lastActiveDate,
        freezesAvailable: data.freezesAvailable,
        freezeUsedDate: data.freezeUsedDate ?? null,
      };
    },
    upsertPlant: async (_tx, _userId, data) => {
      if (overrides.failOn === "upsertPlant") {
        throw new Error("simulated upsertPlant failure");
      }
      fakes.plant = { growthPoints: data.growthPoints };
    },
    loadAchievementContext: async (_tx, _userId, hint) => ({
      moodCount: 1,
      exerciseCount: 0,
      breathingExerciseCount: 0,
      journalCount: 0,
      completedTestSessionsCount: 0,
      distinctCompletedTestsCount: 0,
      totalTestsCount: 0,
      currentStreak: hint.currentStreak,
      plantStage: hint.plantStage,
      ...overrides.contextOverrides,
    }),
    hasAchievement: async (_tx, _userId, slug) => fakes.awardedSlugs.has(slug),
    awardAchievement: async (_tx, _userId, slug) => {
      if (overrides.failOn === "awardAchievement") {
        throw new Error("simulated awardAchievement failure");
      }
      if (fakes.awardedSlugs.has(slug)) return false;
      fakes.awardedSlugs.add(slug);
      return true;
    },
    withTransaction: async (fn) => {
      // Snapshot state — restore on failure to simulate Postgres rollback.
      const snapshot = {
        streak: fakes.streak ? { ...fakes.streak } : null,
        plant: fakes.plant ? { ...fakes.plant } : null,
        awardedSlugs: new Set(fakes.awardedSlugs),
      };
      try {
        return await fn({} as unknown as never);
      } catch (err) {
        fakes.streak = snapshot.streak;
        fakes.plant = snapshot.plant;
        fakes.awardedSlugs = snapshot.awardedSlugs;
        throw err;
      }
    },
    currentDay: () =>
      overrides.currentDayProvider
        ? overrides.currentDayProvider()
        : overrides.currentDay ?? "2026-04-26",
  };

  return { service: createProductiveActionService(deps), fakes };
}

test("first productive action ever: creates streak=1, adds plant points, awards first-mood", async () => {
  const { service, fakes } = makeService();

  const result = await service.recordProductiveAction("user-1", "mood");

  assert.equal(result.isFirstToday, true);
  assert.equal(result.streakUpdated, true);
  assert.equal(result.plantPointsAdded, 10);
  assert.deepEqual(result.achievementsAwarded, ["first-mood"]);

  assert.equal(fakes.streak?.currentStreak, 1);
  assert.equal(fakes.streak?.lastActiveDate, "2026-04-26");
  assert.equal(fakes.plant?.growthPoints, 10);
  assert.ok(fakes.awardedSlugs.has("first-mood"));
});

test("five productive actions in same Almaty day: streak/plant updated exactly once", async () => {
  const { service, fakes } = makeService();

  const r1 = await service.recordProductiveAction("user-1", "mood");
  const r2 = await service.recordProductiveAction("user-1", "exercise");
  const r3 = await service.recordProductiveAction("user-1", "journal");
  const r4 = await service.recordProductiveAction("user-1", "cbt");
  const r5 = await service.recordProductiveAction("user-1", "ai_chat");

  assert.equal(r1.isFirstToday, true);
  assert.equal(r2.isFirstToday, false);
  assert.equal(r3.isFirstToday, false);
  assert.equal(r4.isFirstToday, false);
  assert.equal(r5.isFirstToday, false);

  // Subsequent calls add no points and award nothing.
  for (const r of [r2, r3, r4, r5]) {
    assert.equal(r.streakUpdated, false);
    assert.equal(r.plantPointsAdded, 0);
    assert.deepEqual(r.achievementsAwarded, []);
  }

  // State reflects only the first call (mood → 10 points).
  assert.equal(fakes.streak?.currentStreak, 1);
  assert.equal(fakes.plant?.growthPoints, 10);
});

test("productive actions on consecutive Almaty days: streak grows day-by-day", async () => {
  let day = "2026-04-24";
  const { service, fakes } = makeService({
    currentDayProvider: () => day,
  });

  await service.recordProductiveAction("user-1", "mood");
  assert.equal(fakes.streak?.currentStreak, 1);

  day = "2026-04-25";
  const r2 = await service.recordProductiveAction("user-1", "exercise");
  assert.equal(r2.isFirstToday, true);
  assert.equal(fakes.streak?.currentStreak, 2);
  // Plant accumulates across days (10 mood + 15 exercise).
  assert.equal(fakes.plant?.growthPoints, 25);

  day = "2026-04-26";
  const r3 = await service.recordProductiveAction("user-1", "journal");
  assert.equal(r3.isFirstToday, true);
  assert.equal(fakes.streak?.currentStreak, 3);
  assert.equal(fakes.streak?.lastActiveDate, "2026-04-26");
  assert.equal(fakes.plant?.growthPoints, 35);
});

test("when awardAchievement throws inside the transaction, streak and plant are rolled back", async () => {
  const { service, fakes } = makeService({ failOn: "awardAchievement" });

  await assert.rejects(
    () => service.recordProductiveAction("user-1", "mood"),
    /simulated awardAchievement failure/,
  );

  // Nothing persisted — neither streak nor plant got committed.
  assert.equal(fakes.streak, null);
  assert.equal(fakes.plant, null);
  assert.equal(fakes.awardedSlugs.size, 0);
});

test("when upsertPlant throws, streak update is rolled back", async () => {
  const { service, fakes } = makeService({ failOn: "upsertPlant" });

  await assert.rejects(
    () => service.recordProductiveAction("user-1", "mood"),
    /simulated upsertPlant failure/,
  );

  assert.equal(fakes.streak, null);
  assert.equal(fakes.plant, null);
});

test("when productive action lifts streak to 3, awards streak-3 (not just source-trigger slugs)", async () => {
  // Pre-seed state: yesterday user had streak=2; today's mood entry pushes it to 3.
  let day = "2026-04-26";
  const { service, fakes } = makeService({
    currentDayProvider: () => day,
  });
  fakes.streak = {
    currentStreak: 2,
    longestStreak: 2,
    lastActiveDate: "2026-04-25",
    freezesAvailable: 1,
    freezeUsedDate: null,
  };
  // Already earned first-mood — only the streak achievement should be new.
  fakes.awardedSlugs.add("first-mood");

  const result = await service.recordProductiveAction("user-1", "mood");

  assert.equal(result.streakUpdated, true);
  assert.equal(fakes.streak?.currentStreak, 3);
  assert.ok(
    result.achievementsAwarded.includes("streak-3"),
    `expected streak-3 in awarded list, got ${JSON.stringify(result.achievementsAwarded)}`,
  );
});

test("test-completion productive action: awards first-test trigger slugs", async () => {
  const { service, fakes } = makeService({
    contextOverrides: { completedTestSessionsCount: 1 },
  });

  const result = await service.recordProductiveAction("user-1", "test");

  assert.equal(result.isFirstToday, true);
  assert.ok(
    result.achievementsAwarded.includes("first-test"),
    `expected first-test in awarded list, got ${JSON.stringify(result.achievementsAwarded)}`,
  );
});

test("when productive action lifts plant to stage 2, awards plant-sprout", async () => {
  const { service, fakes } = makeService({
    currentDay: "2026-04-26",
  });
  // 45 + 15 (exercise) = 60 → stage 2 (>= 50).
  fakes.plant = { growthPoints: 45 };
  fakes.streak = {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: "2026-04-25",
    freezesAvailable: 1,
    freezeUsedDate: null,
  };
  fakes.awardedSlugs.add("first-exercise");

  const result = await service.recordProductiveAction("user-1", "exercise");

  assert.equal(fakes.plant?.growthPoints, 60);
  assert.ok(
    result.achievementsAwarded.includes("plant-sprout"),
    `expected plant-sprout in awarded list, got ${JSON.stringify(result.achievementsAwarded)}`,
  );
});
