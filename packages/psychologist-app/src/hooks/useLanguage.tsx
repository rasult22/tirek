import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { ru } from "@tirek/shared/i18n";
import { kz } from "@tirek/shared/i18n";
import type { TranslationKeys, Language } from "@tirek/shared/i18n";

const translations: Record<Language, TranslationKeys> = { ru, kz };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ru",
  setLanguage: () => {},
  t: ru,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("tirek-language");
    return (saved === "kz" ? "kz" : "ru") as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    localStorage.setItem("tirek-language", lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  return useContext(LanguageContext).t;
}
