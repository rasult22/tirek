export { ru, type TranslationKeys } from "./ru";
export { kz } from "./kz";

export type Language = "ru" | "kz";

export const languages: Record<Language, string> = {
  ru: "Русский",
  kz: "Қазақша",
};

export function getTranslations(lang: Language): import("./ru").TranslationKeys {
  if (lang === "kz") {
    return import("./kz").then((m) => m.kz) as any;
  }
  return import("./ru").then((m) => m.ru) as any;
}
