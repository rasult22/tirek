import { v4 as uuidv4 } from "uuid";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { cbtRepository } from "./cbt.repository.js";
import { streaksService } from "../streaks/streaks.service.js";
import { virtualPlantService } from "../virtual-plant/virtual-plant.service.js";
import { achievementsService } from "../achievements/achievements.service.js";

const VALID_TYPES = [
  "thought_diary",
  "circle_of_control",
  "stop_technique",
  "behavioral_experiment",
];

function validateCbtData(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "thought_diary":
      if (!data.situation || !data.thought || !data.emotion)
        throw new ValidationError(
          "Thought diary requires situation, thought, and emotion",
        );
      break;
    case "circle_of_control":
      if (!Array.isArray(data.canControl) || !Array.isArray(data.cannotControl))
        throw new ValidationError(
          "Circle of control requires canControl and cannotControl arrays",
        );
      break;
    case "stop_technique":
      if (!data.stop || !data.breathe || !data.observe || !data.proceed)
        throw new ValidationError(
          "STOP technique requires all four steps",
        );
      break;
    case "behavioral_experiment":
      if (!data.hypothesis || !data.experiment)
        throw new ValidationError(
          "Behavioral experiment requires hypothesis and experiment",
        );
      break;
  }
}

export const cbtService = {
  async create(
    userId: string,
    body: { type: string; data: Record<string, unknown> },
  ) {
    if (!body.type || !VALID_TYPES.includes(body.type)) {
      throw new ValidationError("Invalid CBT exercise type");
    }
    if (!body.data || typeof body.data !== "object") {
      throw new ValidationError("Data is required");
    }

    validateCbtData(body.type, body.data);

    const entry = await cbtRepository.create({
      id: uuidv4(),
      userId,
      type: body.type,
      data: body.data,
    });

    // Fire-and-forget gamification
    streaksService.recordActivity(userId).catch(() => {});
    virtualPlantService.addPoints(userId, 15).catch(() => {});
    achievementsService
      .checkAndAward(userId, { trigger: "exercise", exerciseType: "cbt" })
      .catch(() => {});

    return entry;
  },

  async list(
    userId: string,
    pagination: PaginationParams,
    type?: string,
  ) {
    if (type && !VALID_TYPES.includes(type)) {
      throw new ValidationError("Invalid CBT exercise type filter");
    }
    const [entries, total] = await Promise.all([
      cbtRepository.findByUser(userId, pagination, type),
      cbtRepository.countByUser(userId, type),
    ]);
    return paginated(entries, total, pagination);
  },

  async update(
    userId: string,
    entryId: string,
    data: Record<string, unknown>,
  ) {
    const entry = await cbtRepository.findById(entryId);
    if (!entry) throw new NotFoundError("CBT entry not found");
    if (entry.userId !== userId) throw new ForbiddenError("Access denied");

    const merged = { ...(entry.data as Record<string, unknown>), ...data };
    return cbtRepository.update(entryId, merged);
  },

  async delete(userId: string, entryId: string) {
    const entry = await cbtRepository.findById(entryId);
    if (!entry) throw new NotFoundError("CBT entry not found");
    if (entry.userId !== userId) throw new ForbiddenError("Access denied");
    await cbtRepository.deleteById(entryId);
    return { ok: true };
  },

  async listForStudent(
    studentId: string,
    pagination: PaginationParams,
    type?: string,
  ) {
    const [entries, total] = await Promise.all([
      cbtRepository.findByUser(studentId, pagination, type),
      cbtRepository.countByUser(studentId, type),
    ]);
    return paginated(entries, total, pagination);
  },
};
