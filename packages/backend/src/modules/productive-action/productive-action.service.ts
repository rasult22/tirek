import {
  type AchievementContext,
  type AchievementTrigger,
  getCandidateSlugs,
  isConditionMet,
} from "../../lib/achievement-checker/achievement-checker.js";
import { computeStreak } from "../../lib/streak-engine/streak-engine.js";
import { computeStage } from "../../lib/plant-growth/plant-growth.js";

export type ProductiveActionSource =
  | "mood"
  | "exercise"
  | "journal"
  | "cbt"
  | "ai_chat"
  | "test";

export interface ProductiveActionResult {
  isFirstToday: boolean;
  streakUpdated: boolean;
  plantPointsAdded: number;
  achievementsAwarded: string[];
}

// Tx-handle is opaque to the coordinator — deps decide whether it's a real
// Drizzle tx or an in-memory fake.
export type Tx = unknown;

export interface PersistedStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  freezesAvailable: number;
  freezeUsedDate: string | null;
}

export interface UpsertStreakInput {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  freezesAvailable: number;
  freezeUsedDate: string | null;
}

export interface PersistedPlant {
  growthPoints: number;
}

export interface UpsertPlantInput {
  growthPoints: number;
  stage: 1 | 2 | 3 | 4;
  lastWateredAt: Date;
}

export interface ProductiveActionDeps {
  getStreak: (userId: string) => Promise<PersistedStreak | null>;
  getPlant: (userId: string) => Promise<PersistedPlant | null>;
  upsertStreak: (tx: Tx, userId: string, data: UpsertStreakInput) => Promise<void>;
  upsertPlant: (tx: Tx, userId: string, data: UpsertPlantInput) => Promise<void>;
  loadAchievementContext: (
    tx: Tx,
    userId: string,
    hint: { currentStreak: number; plantStage: 1 | 2 | 3 | 4 },
  ) => Promise<AchievementContext>;
  hasAchievement: (tx: Tx, userId: string, slug: string) => Promise<boolean>;
  // Returns true iff this call actually inserted (i.e. not a no-op on conflict).
  // Production impl is responsible for any side-effects tied to a freshly
  // awarded achievement (e.g. enqueueing a notification) — those must run
  // inside `tx` so they roll back together with the award.
  awardAchievement: (tx: Tx, userId: string, slug: string) => Promise<boolean>;
  withTransaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
  currentDay: () => string;
  // Called after a successful productive action so dependent caches (e.g. AI-Friend
  // student-context) can refresh on the next message. Optional — tests omit it.
  onAfterAction?: (userId: string, source: ProductiveActionSource) => void;
}

const POINTS_BY_SOURCE: Record<ProductiveActionSource, number> = {
  mood: 10,
  exercise: 15,
  journal: 10,
  cbt: 15,
  ai_chat: 0,
  test: 10,
};

const ACHIEVEMENT_TRIGGER_BY_SOURCE: Record<
  ProductiveActionSource,
  AchievementTrigger
> = {
  mood: "mood",
  exercise: "exercise",
  journal: "journal",
  cbt: "exercise",
  ai_chat: "mood",
  test: "test",
};

export function createProductiveActionService(deps: ProductiveActionDeps) {
  return {
    async recordProductiveAction(
      userId: string,
      source: ProductiveActionSource,
    ): Promise<ProductiveActionResult> {
      const today = deps.currentDay();
      const existingStreak = await deps.getStreak(userId);
      const existingPlant = await deps.getPlant(userId);

      const isFirstToday = existingStreak?.lastActiveDate !== today;

      if (!isFirstToday) {
        deps.onAfterAction?.(userId, source);
        return {
          isFirstToday: false,
          streakUpdated: false,
          plantPointsAdded: 0,
          achievementsAwarded: [],
        };
      }

      const points = POINTS_BY_SOURCE[source];
      const trigger = ACHIEVEMENT_TRIGGER_BY_SOURCE[source];

      return deps.withTransaction(async (tx) => {
        const { newStreak, newFreezes, freezeUsed } = computeStreak({
          lastActiveDate: existingStreak?.lastActiveDate ?? null,
          currentDay: today,
          currentStreak: existingStreak?.currentStreak ?? 0,
          freezesAvailable: existingStreak?.freezesAvailable ?? 1,
        });
        const newLongest = Math.max(
          existingStreak?.longestStreak ?? 0,
          newStreak,
        );
        await deps.upsertStreak(tx, userId, {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: today,
          freezesAvailable: newFreezes,
          freezeUsedDate: freezeUsed
            ? today
            : existingStreak?.freezeUsedDate ?? null,
        });

        const newPoints = (existingPlant?.growthPoints ?? 0) + points;
        const newStage = computeStage(newPoints);
        await deps.upsertPlant(tx, userId, {
          growthPoints: newPoints,
          stage: newStage,
          lastWateredAt: new Date(),
        });

        const ctx = await deps.loadAchievementContext(tx, userId, {
          currentStreak: newStreak,
          plantStage: newStage,
        });

        // streak/plant always re-checked because every productive action mutates
        // both — without this we'd miss streak-3 / plant-sprout when source is 'mood'.
        const triggersToCheck: AchievementTrigger[] = [trigger, "streak", "plant"];

        const awarded: string[] = [];
        const seen = new Set<string>();
        for (const t of triggersToCheck) {
          for (const slug of getCandidateSlugs(t)) {
            if (seen.has(slug)) continue;
            seen.add(slug);
            if (!isConditionMet(slug, ctx)) continue;
            if (await deps.hasAchievement(tx, userId, slug)) continue;
            const inserted = await deps.awardAchievement(tx, userId, slug);
            if (inserted) {
              awarded.push(slug);
            }
          }
        }

        return {
          isFirstToday: true,
          streakUpdated: true,
          plantPointsAdded: points,
          achievementsAwarded: awarded,
        };
      }).then((result) => {
        deps.onAfterAction?.(userId, source);
        return result;
      });
    },
  };
}
