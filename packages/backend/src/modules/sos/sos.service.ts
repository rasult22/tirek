import { v4 as uuidv4 } from "uuid";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { crisisSignalsService } from "../crisis-signals/crisis-signals.service.js";
import { sosRepository } from "./sos.repository.js";
import { createSosTriggerService, type SosAction } from "./sos-trigger.js";

const triggerService = createSosTriggerService({
  saveEvent: async (event) => {
    const row = await sosRepository.create({
      id: event.id,
      userId: event.userId,
      type: event.type,
      createdAt: event.createdAt,
    });
    return {
      id: row.id,
      userId: row.userId,
      type: event.type,
      createdAt: row.createdAt,
    };
  },
  routeCrisisSignal: (input) => crisisSignalsService.route(input),
  now: () => new Date(),
  newId: () => uuidv4(),
});

export const sosService = {
  trigger(userId: string, body: { action: SosAction }) {
    return triggerService.trigger(userId, body);
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
    body: {
      notes?: string;
      contactedStudent?: boolean;
      contactedParent?: boolean;
      documented?: boolean;
    },
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
      contactedStudent: body.contactedStudent,
      contactedParent: body.contactedParent,
      documented: body.documented,
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
