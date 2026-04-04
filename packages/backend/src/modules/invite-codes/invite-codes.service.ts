import { v4 as uuidv4 } from "uuid";
import {
  NotFoundError,
  ValidationError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { inviteCodesRepository } from "./invite-codes.repository.js";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const inviteCodesService = {
  async generate(
    psychologistId: string,
    body: { count?: number; grade?: number; classLetter?: string },
  ) {
    const count = body.count ?? 1;
    if (count < 1 || count > 100) {
      throw new ValidationError("Count must be between 1 and 100");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = await inviteCodesRepository.create({
        id: uuidv4(),
        code: generateCode(),
        psychologistId,
        grade: body.grade ?? null,
        classLetter: body.classLetter ?? null,
        expiresAt,
      });
      codes.push(code);
    }

    return codes;
  },

  async list(psychologistId: string, pagination: PaginationParams) {
    const [codes, total] = await Promise.all([
      inviteCodesRepository.findByPsychologist(psychologistId, pagination),
      inviteCodesRepository.countByPsychologist(psychologistId),
    ]);

    const mapped = codes.map((c) => ({
      id: c.id,
      code: c.code,
      grade: c.grade,
      classLetter: c.classLetter,
      status: c.usedBy
        ? "used"
        : c.expiresAt && c.expiresAt < new Date()
          ? "expired"
          : "active",
      usedBy: c.usedBy,
      usedAt: c.usedAt,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    }));

    return paginated(mapped, total, pagination);
  },

  async revoke(psychologistId: string, codeId: string) {
    const code = await inviteCodesRepository.findById(codeId);

    if (!code) {
      throw new NotFoundError("Invite code not found");
    }

    if (code.psychologistId !== psychologistId) {
      throw new NotFoundError("Invite code not found");
    }

    if (code.usedBy) {
      throw new ValidationError("Cannot revoke an already used invite code");
    }

    const deleted = await inviteCodesRepository.deleteById(codeId);
    if (!deleted) {
      throw new NotFoundError("Invite code not found or already used");
    }

    return { success: true };
  },
};
