import { paginated, type PaginationParams } from "../../shared/pagination.js";
import { crisisFeedRepository } from "./crisis-feed.repository.js";
import {
  createCrisisFeedService,
  type PersistedSignalRow,
  type ResolveBody,
} from "./crisis-feed.service.js";

// findById is parameterized with the actor (psychologist) so the repo can
// enforce ownership via JOIN. We close over actorId at call time below.
function makeFeedServiceFor(actorId: string) {
  return createCrisisFeedService({
    findByPsychologistAndType: (psychologistId, type, options) => {
      if (!options.onlyActive) {
        throw new Error(
          "findByPsychologistAndType only supports onlyActive=true at the moment",
        );
      }
      return crisisFeedRepository.findActiveByPsychologistAndType(
        psychologistId,
        type,
      );
    },
    findHistoryByPsychologist: async (psychologistId) => {
      const { items } = await crisisFeedRepository.findHistoryByPsychologist(
        psychologistId,
        { limit: 1000, offset: 0 },
      );
      return items;
    },
    findById: async (id): Promise<PersistedSignalRow | null> => {
      return crisisFeedRepository.findByIdForPsychologist(id, actorId);
    },
    resolveSignal: (id, input) => crisisFeedRepository.resolveSignal(id, input),
    now: () => new Date(),
  });
}

export const crisisFeedModule = {
  getRedFeed(psychologistId: string) {
    return makeFeedServiceFor(psychologistId).getRedFeed(psychologistId);
  },

  getYellowFeed(psychologistId: string) {
    return makeFeedServiceFor(psychologistId).getYellowFeed(psychologistId);
  },

  async getHistory(psychologistId: string, pagination: PaginationParams) {
    const { items, total } =
      await crisisFeedRepository.findHistoryByPsychologist(psychologistId, pagination);
    return paginated(items, total, pagination);
  },

  async resolve(
    psychologistId: string,
    signalId: string,
    body: ResolveBody,
  ) {
    return makeFeedServiceFor(psychologistId).resolve(
      psychologistId,
      signalId,
      body,
    );
  },

  countActiveRed(psychologistId: string) {
    return crisisFeedRepository.countActiveByPsychologistAndType(
      psychologistId,
      "acute_crisis",
    );
  },

  countActiveYellow(psychologistId: string) {
    return crisisFeedRepository.countActiveByPsychologistAndType(
      psychologistId,
      "concern",
    );
  },
};
