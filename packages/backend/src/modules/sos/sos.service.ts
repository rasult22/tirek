import { v4 as uuidv4 } from "uuid";
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
};
