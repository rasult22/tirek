import { v4 as uuidv4 } from "uuid";
import {
  createCrisisSignalRouter,
  type CrisisSignalRouterInput,
  type CrisisSignalRouterResult,
} from "./crisis-signal-router.js";
import { crisisSignalsRepository } from "./crisis-signals.repository.js";

const router = createCrisisSignalRouter({
  saveSignal: (signal) => crisisSignalsRepository.insertSignal(signal),
  findPsychologistIdsForStudent: (studentId) =>
    crisisSignalsRepository.findPsychologistIdsForStudent(studentId),
  createNotification: (notification) =>
    crisisSignalsRepository.insertNotification(notification),
  logger: {
    warn: (msg, ctx) => {
      console.warn(`[crisis-signals] ${msg}`, ctx ?? {});
    },
  },
  now: () => new Date(),
  newId: () => uuidv4(),
});

export const crisisSignalsService = {
  route(input: CrisisSignalRouterInput): Promise<CrisisSignalRouterResult> {
    return router.route(input);
  },
};
