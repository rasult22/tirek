import type { PersistedUser } from "./auth.service.js";
import type { Language } from "@tirek/shared/i18n";
import { TooManyRequestsError, ValidationError } from "../../shared/errors.js";

export type PersistedResetCode = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  attempts: number;
  createdAt: Date;
};

export type InsertResetCodeInput = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };

export type PasswordResetServiceDeps = {
  findUserByEmail: (email: string) => Promise<PersistedUser | null>;
  invalidateActiveCodesForUser: (userId: string, when: Date) => Promise<void>;
  countRecentCodesForUser: (userId: string, since: Date) => Promise<number>;
  findLatestCodeForUser: (userId: string) => Promise<PersistedResetCode | null>;
  findActiveCodeForUser: (
    userId: string,
    when: Date,
  ) => Promise<PersistedResetCode | null>;
  insertCode: (data: InsertResetCodeInput) => Promise<PersistedResetCode>;
  incrementAttempts: (codeId: string) => Promise<PersistedResetCode | null>;
  markCodeUsed: (codeId: string, when: Date) => Promise<void>;
  updateUserPassword: (userId: string, passwordHash: string) => Promise<void>;
  sendResetCodeEmail: (
    email: string,
    code: string,
    lang: Language,
  ) => Promise<SendEmailResult>;
  hashCode: (code: string) => Promise<string>;
  verifyCode: (code: string, hash: string) => Promise<boolean>;
  hashPassword: (password: string) => Promise<string>;
  signToken: (payload: {
    userId: string;
    email: string;
    role: string;
  }) => string;
  now: () => Date;
  newId: () => string;
  generateCode: () => string;
};

const CODE_TTL_MS = 15 * 60 * 1000;
const DEBOUNCE_MS = 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const MAX_VERIFY_ATTEMPTS = 5;

export function createPasswordResetService(deps: PasswordResetServiceDeps) {
  return {
    async requestCode(body: { email?: string }) {
      const email = body.email;
      if (!email) {
        return { success: true } as const;
      }

      const user = await deps.findUserByEmail(email);
      if (!user) {
        return { success: true } as const;
      }

      const now = deps.now();

      const latest = await deps.findLatestCodeForUser(user.id);
      if (latest && now.getTime() - latest.createdAt.getTime() < DEBOUNCE_MS) {
        throw new TooManyRequestsError(
          "Подождите немного перед повторной отправкой кода",
        );
      }

      const since = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
      const recentCount = await deps.countRecentCodesForUser(user.id, since);
      if (recentCount >= RATE_LIMIT_MAX_REQUESTS) {
        throw new TooManyRequestsError(
          "Слишком много запросов. Попробуйте позже",
        );
      }

      await deps.invalidateActiveCodesForUser(user.id, now);

      const code = deps.generateCode();
      const codeHash = await deps.hashCode(code);

      await deps.insertCode({
        id: deps.newId(),
        userId: user.id,
        codeHash,
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        createdAt: now,
      });

      await deps.sendResetCodeEmail(email, code, user.language as Language);

      return { success: true } as const;
    },

    async verifyCode(body: { email?: string; code?: string }) {
      const { email, code } = body;
      if (!email || !code) {
        throw new ValidationError("Email и код обязательны");
      }

      const user = await deps.findUserByEmail(email);
      if (!user) {
        throw new ValidationError("Неверный код");
      }

      const now = deps.now();
      const active = await deps.findActiveCodeForUser(user.id, now);
      if (!active) {
        throw new ValidationError("Неверный код");
      }

      const updated = await deps.incrementAttempts(active.id);
      const codeOk = await deps.verifyCode(code, active.codeHash);

      if (!codeOk) {
        if (updated && updated.attempts >= MAX_VERIFY_ATTEMPTS) {
          await deps.markCodeUsed(active.id, now);
        }
        throw new ValidationError("Неверный код");
      }

      return { valid: true } as const;
    },

    async resetPassword(body: {
      email?: string;
      code?: string;
      newPassword?: string;
    }) {
      const { email, code, newPassword } = body;
      if (!email || !code || !newPassword) {
        throw new ValidationError("Email, код и новый пароль обязательны");
      }

      const user = await deps.findUserByEmail(email);
      if (!user) {
        throw new ValidationError("Неверный код");
      }

      const now = deps.now();
      const active = await deps.findActiveCodeForUser(user.id, now);
      if (!active) {
        throw new ValidationError("Неверный код");
      }

      const codeOk = await deps.verifyCode(code, active.codeHash);
      if (!codeOk) {
        throw new ValidationError("Неверный код");
      }

      const passwordHash = await deps.hashPassword(newPassword);
      await deps.updateUserPassword(user.id, passwordHash);
      await deps.markCodeUsed(active.id, now);

      const token = deps.signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          language: user.language,
          avatarId: user.avatarId,
          grade: user.grade,
          classLetter: user.classLetter,
          schoolId: user.schoolId,
        },
      };
    },
  };
}
