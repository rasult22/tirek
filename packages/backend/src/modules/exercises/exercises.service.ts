import { v4 as uuidv4 } from "uuid";
import { eq, count as dbCount, isNotNull } from "drizzle-orm";
import { NotFoundError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { exercisesRepository } from "./exercises.repository.js";
import { streaksService } from "../streaks/streaks.service.js";
import { db } from "../../db/index.js";
import { exerciseCompletions, diagnosticSessions, journalEntries } from "../../db/schema.js";

export const exercisesService = {
  async list() {
    return exercisesRepository.findAll();
  },

  async complete(
    userId: string,
    exerciseId: string,
    body: { durationSeconds?: number },
  ) {
    // Try finding by ID first, then by slug (frontend sends slug)
    let exercise = await exercisesRepository.findById(exerciseId);
    if (!exercise) {
      exercise = await exercisesRepository.findBySlug(exerciseId);
    }
    if (!exercise) {
      throw new NotFoundError("Exercise not found");
    }

    const completion = await exercisesRepository.createCompletion({
      id: uuidv4(),
      userId,
      exerciseId: exercise.id,
      durationSeconds: body.durationSeconds ?? null,
    });

    // Record streak activity (fire-and-forget)
    streaksService.recordActivity(userId).catch(() => {});

    return completion;
  },

  async getHistory(userId: string, pagination: PaginationParams) {
    const [rows, total] = await Promise.all([
      exercisesRepository.findCompletionsByUser(userId, pagination),
      exercisesRepository.countCompletionsByUser(userId),
    ]);

    const data = rows.map((r) => ({
      id: r.completion.id,
      exerciseId: r.exercise.id,
      exerciseName: r.exercise.nameRu,
      exerciseType: r.exercise.type,
      durationSeconds: r.completion.durationSeconds,
      completedAt: r.completion.completedAt,
    }));

    return paginated(data, total, pagination);
  },

  async getStats(userId: string) {
    const [exercisesRow] = await db
      .select({ value: dbCount() })
      .from(exerciseCompletions)
      .where(eq(exerciseCompletions.userId, userId));

    const [testsRow] = await db
      .select({ value: dbCount() })
      .from(diagnosticSessions)
      .where(eq(diagnosticSessions.userId, userId));

    const [journalRow] = await db
      .select({ value: dbCount() })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    return {
      exercisesCompleted: Number(exercisesRow?.value ?? 0),
      testsCompleted: Number(testsRow?.value ?? 0),
      journalEntries: Number(journalRow?.value ?? 0),
    };
  },
};
