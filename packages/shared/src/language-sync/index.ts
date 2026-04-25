import type { Language } from "../i18n/index.js";

const SUPPORTED: readonly Language[] = ["ru", "kz"] as const;

/**
 * Narrow an arbitrary value to a supported Language, or null. Used for
 * defensively reading values that came from localStorage / network.
 */
export function parseLanguage(value: unknown): Language | null {
  if (typeof value !== "string") return null;
  return (SUPPORTED as readonly string[]).includes(value)
    ? (value as Language)
    : null;
}

/** Result of fetching language from the server (e.g. GET /auth/me). */
export type ServerLanguageResult =
  | { ok: true; language: unknown }
  | { ok: false };

/**
 * Decide which language to use on app start, given:
 *   - what the server said (DB is source of truth when reachable)
 *   - what localStorage had cached (silent offline fallback)
 *   - a default to fall back to when neither is usable
 *
 * Returns both the chosen language and whether localStorage needs to be
 * rewritten (i.e. server overrode a stale local value).
 */
export function pickInitialLanguage(opts: {
  server: ServerLanguageResult;
  local: unknown;
  defaultLang: Language;
}): { language: Language; writeLocal: boolean } {
  const localLang = parseLanguage(opts.local);

  if (opts.server.ok) {
    const serverLang = parseLanguage(opts.server.language);
    if (serverLang) {
      return {
        language: serverLang,
        writeLocal: serverLang !== localLang,
      };
    }
  }

  if (localLang) {
    return { language: localLang, writeLocal: false };
  }

  return { language: opts.defaultLang, writeLocal: false };
}

/**
 * Decide whether to PATCH /auth/profile after a setLanguage(). True when the
 * desired language differs from what the server is known to have (or when the
 * server's value is unknown/stale).
 */
export function shouldPersistToServer(
  currentOnServer: unknown,
  desired: Language,
): boolean {
  const known = parseLanguage(currentOnServer);
  return known !== desired;
}
