import { v4 as uuidv4 } from "uuid";
import { paginated, type PaginationParams } from "../../shared/pagination.js";
import { crisisSignalsRepository } from "./crisis-signals.repository.js";
import { createCrisisSignalsModule } from "./index.js";

const _module = createCrisisSignalsModule({
  saveSignal: (signal) => crisisSignalsRepository.insertSignal(signal),
  findPsychologistIdsForStudent: (studentId) =>
    crisisSignalsRepository.findPsychologistIdsForStudent(studentId),
  findActiveByPsychologistAndType: (psychologistId, type) =>
    crisisSignalsRepository.findActiveByPsychologistAndType(
      psychologistId,
      type,
    ),
  findHistoryByPsychologist: async (psychologistId) => {
    const { items } = await crisisSignalsRepository.findHistoryByPsychologist(
      psychologistId,
    );
    return items;
  },
  findById: (id, psychologistId) =>
    crisisSignalsRepository.findByIdForPsychologist(id, psychologistId),
  resolveSignal: (id, input) =>
    crisisSignalsRepository.resolveSignal(id, input),
  logger: {
    warn: (msg, ctx) => {
      console.warn(`[crisis-signals] ${msg}`, ctx ?? {});
    },
  },
  now: () => new Date(),
  newId: () => uuidv4(),
});

export const crisisSignalsModule = {
  ..._module,

  async historyPaginated(psychologistId: string, pagination: PaginationParams) {
    const { items, total } =
      await crisisSignalsRepository.findHistoryByPsychologist(
        psychologistId,
        pagination,
      );
    return paginated(items, total, pagination);
  },

  countActiveRed(psychologistId: string) {
    return crisisSignalsRepository.countActiveByPsychologistAndType(
      psychologistId,
      "acute_crisis",
    );
  },

  countActiveYellow(psychologistId: string) {
    return crisisSignalsRepository.countActiveByPsychologistAndType(
      psychologistId,
      "concern",
    );
  },
};
