export { ru, type TranslationKeys } from "./ru.js";
export { kz } from "./kz.js";

export type Language = "ru" | "kz";

export const languages: Record<Language, string> = {
  ru: "Русский",
  kz: "Қазақша",
};

export function getTranslations(lang: Language): import("./ru.js").TranslationKeys {
  if (lang === "kz") {
    return import("./kz.js").then((m) => m.kz) as any;
  }
  return import("./ru.js").then((m) => m.ru) as any;
}
