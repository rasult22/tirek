import {
  NotFoundError,
  ValidationError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";

export type PersistedInviteCode = {
  id: string;
  code: string;
  psychologistId: string;
  studentRealName: string;
  grade: number | null;
  classLetter: string | null;
  usedBy: string | null;
  usedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export type CreateInviteCodeInput = {
  id: string;
  code: string;
  psychologistId: string;
  studentRealName: string;
  grade?: number | null;
  classLetter?: string | null;
  expiresAt: Date;
};

export type InviteCodesServiceDeps = {
  createInviteCode: (data: CreateInviteCodeInput) => Promise<PersistedInviteCode>;
  findByPsychologist: (
    psychologistId: string,
    pagination: PaginationParams,
  ) => Promise<PersistedInviteCode[]>;
  countByPsychologist: (psychologistId: string) => Promise<number>;
  findById: (id: string) => Promise<PersistedInviteCode | null>;
  deleteById: (id: string) => Promise<PersistedInviteCode | null>;
  now: () => Date;
  newId: () => string;
  newCode: () => string;
};

export type GenerateInviteCodesInput = {
  studentNames: string[];
  grade?: number;
  classLetter?: string;
};

export function createInviteCodesService(deps: InviteCodesServiceDeps) {
  return {
    async generate(psychologistId: string, body: GenerateInviteCodesInput) {
      const names = body.studentNames ?? [];
      if (names.length < 1) {
        throw new ValidationError("studentNames must contain at least 1 name");
      }
      if (names.length > 100) {
        throw new ValidationError("studentNames cannot exceed 100 entries");
      }

      const expiresAt = new Date(deps.now());
      expiresAt.setDate(expiresAt.getDate() + 30);

      const codes: PersistedInviteCode[] = [];
      for (const name of names) {
        const row = await deps.createInviteCode({
          id: deps.newId(),
          code: deps.newCode(),
          psychologistId,
          studentRealName: name,
          grade: body.grade ?? null,
          classLetter: body.classLetter ?? null,
          expiresAt,
        });
        codes.push(row);
      }

      return codes;
    },

    async list(psychologistId: string, pagination: PaginationParams) {
      const [codes, total] = await Promise.all([
        deps.findByPsychologist(psychologistId, pagination),
        deps.countByPsychologist(psychologistId),
      ]);

      const now = deps.now();
      const mapped = codes.map((c) => ({
        id: c.id,
        code: c.code,
        studentRealName: c.studentRealName,
        grade: c.grade,
        classLetter: c.classLetter,
        status: c.usedBy
          ? "used"
          : c.expiresAt && c.expiresAt < now
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
      const code = await deps.findById(codeId);

      if (!code || code.psychologistId !== psychologistId) {
        throw new NotFoundError("Invite code not found");
      }

      if (code.usedBy) {
        throw new ValidationError("Cannot revoke an already used invite code");
      }

      const deleted = await deps.deleteById(codeId);
      if (!deleted) {
        throw new NotFoundError("Invite code not found or already used");
      }

      return { success: true };
    },
  };
}
