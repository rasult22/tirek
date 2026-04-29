import { createPushTokensService } from "./push-tokens.factory.js";
import { pushTokensRepository } from "./push-tokens.repository.js";

export const pushTokensService = createPushTokensService({
  upsert: pushTokensRepository.upsert,
  findByUserId: pushTokensRepository.findByUserId,
  deleteByToken: pushTokensRepository.deleteByToken,
});
