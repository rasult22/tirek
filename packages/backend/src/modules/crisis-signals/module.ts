import { v4 as uuidv4 } from "uuid";
import { paginated, type PaginationParams } from "../../shared/pagination.js";
import { pushDispatcher } from "../push-dispatcher/push-dispatcher.module.js";
import { crisisSignalsRepository } from "./crisis-signals.repository.js";
import { createCrisisSignalsModule, type DispatchPushFn } from "./index.js";

const dispatchPush: DispatchPushFn = async ({
  recipientPsychologistId,
  signal,
  studentName,
}) => {
  const isRed = signal.type === "acute_crisis";
  const kind = isRed ? "crisis_signal_red" : "crisis_signal_yellow";
  const titlePrefix = isRed ? "🚨 Критический сигнал" : "⚠️ Требует внимания";
  await pushDispatcher.dispatch({
    kind,
    recipientUserId: recipientPsychologistId,
    title: titlePrefix,
    body: `${studentName}: ${signal.summary}`,
    data: {
      type: "crisis_alert",
      signalId: signal.id,
      studentId: signal.studentId,
    },
    currentTime: signal.createdAt,
  });
};

const _module = createCrisisSignalsModule({
  saveSignal: (signal) => crisisSignalsRepository.insertSignal(signal),
  findPsychologistIdsForStudent: (studentId) =>
    crisisSignalsRepository.findPsychologistIdsForStudent(studentId),
  findStudentName: (studentId) =>
    crisisSignalsRepository.findStudentName(studentId),
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
  dispatchPush,
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
