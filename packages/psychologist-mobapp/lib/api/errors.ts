import type { TranslationKeys } from "@tirek/shared/i18n";
import { ApiError } from "./client";

// Маппинг кодов ошибок backend → читаемый текст. Вызовы:
// - login (401 INVALID_CREDENTIALS, обычный bad password)
// - register (409 CONFLICT — email занят)
// - forgot-password / reset (429 TOO_MANY_REQUESTS)
// - всё остальное → серверная ошибка, не пугаем юзера деталями.
export function authErrorMessage(
  err: unknown,
  t: TranslationKeys,
): string {
  if (!(err instanceof ApiError)) {
    return t.auth.connectionError;
  }
  if (err.status === 409) return t.auth.emailAlreadyRegistered;
  if (err.status === 429) return t.auth.tooManyAttempts;
  if (err.status === 401) return t.auth.invalidCredentials;
  if (err.status >= 500) return t.auth.serverError;
  return t.auth.invalidCredentials;
}
