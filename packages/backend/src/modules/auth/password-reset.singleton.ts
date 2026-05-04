import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import { signToken } from "../../lib/jwt.js";
import { authRepository } from "./auth.repository.js";
import { passwordResetRepository } from "./password-reset.repository.js";
import { emailSender } from "../../lib/email-sender/email-sender.singleton.js";
import { createPasswordResetService } from "./password-reset.service.js";
import type {
  PersistedResetCode,
  SendEmailResult,
} from "./password-reset.service.js";
import type { PersistedUser } from "./auth.service.js";
import type { Language } from "@tirek/shared/i18n";

function generate4DigitCode(): string {
  // 0000..9999, дополняем нулями слева
  const n = Math.floor(Math.random() * 10000);
  return n.toString().padStart(4, "0");
}

export const passwordResetService = createPasswordResetService({
  findUserByEmail: (email) =>
    authRepository.findByEmail(email) as Promise<PersistedUser | null>,
  invalidateActiveCodesForUser: (userId, when) =>
    passwordResetRepository.invalidateActiveCodesForUser(userId, when),
  countRecentCodesForUser: (userId, since) =>
    passwordResetRepository.countRecentCodesForUser(userId, since),
  findLatestCodeForUser: (userId) =>
    passwordResetRepository.findLatestCodeForUser(
      userId,
    ) as Promise<PersistedResetCode | null>,
  findActiveCodeForUser: (userId, when) =>
    passwordResetRepository.findActiveCodeForUser(
      userId,
      when,
    ) as Promise<PersistedResetCode | null>,
  insertCode: (data) =>
    passwordResetRepository.insertCode(data) as Promise<PersistedResetCode>,
  incrementAttempts: (codeId) =>
    passwordResetRepository.incrementAttempts(
      codeId,
    ) as Promise<PersistedResetCode | null>,
  markCodeUsed: (codeId, when) =>
    passwordResetRepository.markCodeUsed(codeId, when),
  updateUserPassword: (userId, passwordHash) =>
    passwordResetRepository.updateUserPassword(userId, passwordHash),
  sendResetCodeEmail: async (
    email: string,
    code: string,
    lang: Language,
  ): Promise<SendEmailResult> => {
    if (!emailSender) {
      // SMTP не настроен (локальный dev/CI) — лог в консоль и считаем «отправлено».
      // Реальная отправка только когда сконфигурированы переменные окружения.
      console.warn("[password-reset] emailSender unavailable; logging code", {
        to: email,
        code,
        lang,
      });
      return { ok: true };
    }
    return emailSender.sendResetCode(email, code, lang);
  },
  hashCode: (code) => bcrypt.hash(code, 10),
  verifyCode: (code, hash) => bcrypt.compare(code, hash),
  hashPassword: (pw) => bcrypt.hash(pw, 10),
  signToken,
  now: () => new Date(),
  newId: () => uuidv4(),
  generateCode: generate4DigitCode,
});
