import { eq, desc, count as dbCount, notInArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { exercises, exerciseCompletions } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

const REMOVED_SLUGS = ["circle-of-control", "stop-technique", "behavioral-experiment"];

export const exercisesRepository = {
  async findAll() {
    return db
      .select()
      .from(exercises)
      .where(notInArray(exercises.slug, REMOVED_SLUGS));
  },

  async findById(id: string) {
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);
    return exercise ?? null;
  },

  async findBySlug(slug: string) {
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.slug, slug))
      .limit(1);
    return exercise ?? null;
  },

  async createCompletion(data: {
    id: string;
    userId: string;
    exerciseId: string;
    durationSeconds?: number | null;
  }) {
    const [completion] = await db
      .insert(exerciseCompletions)
      .values({
        id: data.id,
        userId: data.userId,
        exerciseId: data.exerciseId,
        durationSeconds: data.durationSeconds ?? null,
      })
      .returning();
    return completion;
  },

  async findCompletionsByUser(userId: string, pagination: PaginationParams) {
    return db
      .select({
        completion: exerciseCompletions,
        exercise: exercises,
      })
      .from(exerciseCompletions)
      .innerJoin(exercises, eq(exerciseCompletions.exerciseId, exercises.id))
      .where(eq(exerciseCompletions.userId, userId))
      .orderBy(desc(exerciseCompletions.completedAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countCompletionsByUser(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(exerciseCompletions)
      .where(eq(exerciseCompletions.userId, userId));
    return Number(row?.value ?? 0);
  },
};
