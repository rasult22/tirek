import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/index.js";
import {
  studentPsychologist,
  users,
  notifications,
} from "../../db/schema.js";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { sosRepository } from "./sos.repository.js";

export const sosService = {
  async trigger(userId: string, body: { level: number }) {
    if (![1, 2, 3].includes(body.level)) {
      throw new ValidationError("Level must be 1, 2 or 3");
    }

    const event = await sosRepository.create({
      id: uuidv4(),
      userId,
      level: body.level,
    });

    // Find psychologists linked to this student
    const links = await db
      .select({
        psychologistId: studentPsychologist.psychologistId,
      })
      .from(studentPsychologist)
      .where(eq(studentPsychologist.studentId, userId));

    // Get student name for notification body
    const [student] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const studentName = student?.name ?? "Ученик";

    // Create crisis notification for each linked psychologist
    for (const link of links) {
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: link.psychologistId,
        type: "crisis",
        title: "Сигнал SOS",
        body: `${studentName} отправил сигнал SOS (уровень ${body.level})`,
      });
    }

    return event;
  },

  async getActive(psychologistId: string, pagination: PaginationParams) {
    const [items, total] = await Promise.all([
      sosRepository.findActiveByPsychologist(psychologistId, pagination),
      sosRepository.countActiveByPsychologist(psychologistId),
    ]);
    return paginated(items, total, pagination);
  },

  async resolve(
    psychologistId: string,
    eventId: string,
    body: { notes?: string },
  ) {
    const event = await sosRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError("SOS event not found");
    }

    if (event.resolvedAt) {
      throw new ValidationError("SOS event is already resolved");
    }

    return sosRepository.resolve(eventId, {
      resolvedBy: psychologistId,
      notes: body.notes ?? null,
    });
  },

  async getHistory(psychologistId: string, pagination: PaginationParams) {
    const [items, total] = await Promise.all([
      sosRepository.findHistory(psychologistId, pagination),
      sosRepository.countHistory(psychologistId),
    ]);
    return paginated(items, total, pagination);
  },
};
