import { v4 as uuidv4 } from "uuid";
import { NotFoundError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { exercisesRepository } from "./exercises.repository.js";

export const exercisesService = {
  async list() {
    return exercisesRepository.findAll();
  },

  async complete(
    userId: string,
    exerciseId: string,
    body: { durationSeconds?: number },
  ) {
    const exercise = await exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundError("Exercise not found");
    }

    const completion = await exercisesRepository.createCompletion({
      id: uuidv4(),
      userId,
      exerciseId,
      durationSeconds: body.durationSeconds ?? null,
    });

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
};
