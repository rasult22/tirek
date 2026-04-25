import { v4 as uuidv4 } from "uuid";
import { createInviteCodesService } from "./invite-codes.service.js";
import type { PersistedInviteCode } from "./invite-codes.service.js";
import { inviteCodesRepository } from "./invite-codes.repository.js";

function defaultNewCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const inviteCodesService = createInviteCodesService({
  createInviteCode: (data) =>
    inviteCodesRepository.create(data) as Promise<PersistedInviteCode>,
  findByPsychologist: (id, pagination) =>
    inviteCodesRepository.findByPsychologist(id, pagination) as Promise<
      PersistedInviteCode[]
    >,
  countByPsychologist: (id) => inviteCodesRepository.countByPsychologist(id),
  findById: (id) =>
    inviteCodesRepository.findById(id) as Promise<PersistedInviteCode | null>,
  deleteById: (id) =>
    inviteCodesRepository.deleteById(id) as Promise<PersistedInviteCode | null>,
  now: () => new Date(),
  newId: () => uuidv4(),
  newCode: defaultNewCode,
});
