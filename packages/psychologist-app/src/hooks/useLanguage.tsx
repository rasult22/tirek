import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ru } from "@tirek/shared/i18n";
import { kz } from "@tirek/shared/i18n";
import type { TranslationKeys, Language } from "@tirek/shared/i18n";
import {
  parseLanguage,
  pickInitialLanguage,
  shouldPersistToServer,
} from "@tirek/shared/language-sync";
import { getMe, updateProfile } from "../api/auth.js";
import { useAuthStore } from "../store/auth-store.js";

const STORAGE_KEY = "tirek-language";
const translations: Record<Language, TranslationKeys> = { ru, kz };

const SAVE_FAILED_TOAST: Record<Language, string> = {
  ru: "Не удалось сохранить язык на сервере",
  kz: "Тілді серверге сақтау мүмкін болмады",
};

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
  const token = useAuthStore((s) => s.token);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [language, setLang] = useState<Language>(
    () => parseLanguage(localStorage.getItem(STORAGE_KEY)) ?? "ru",
  );
  const [serverKnownLanguage, setServerKnownLanguage] =
    useState<Language | null>(null);

  useEffect(() => {
    if (!token) {
      setServerKnownLanguage(null);
      return;
    }
    let cancelled = false;
    getMe()
      .then((resp) => {
        if (cancelled) return;
        const decision = pickInitialLanguage({
          server: { ok: true, language: resp?.language },
          local: localStorage.getItem(STORAGE_KEY),
          defaultLang: "ru",
        });
        setServerKnownLanguage(decision.language);
        setLang(decision.language);
        if (decision.writeLocal) {
          localStorage.setItem(STORAGE_KEY, decision.language);
        }
      })
      .catch(() => {
        // Silent fallback: keep whatever is currently in localStorage / state.
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLang(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      if (!token) return;
      if (!shouldPersistToServer(serverKnownLanguage, lang)) return;
      updateProfile({ language: lang })
        .then(() => {
          setServerKnownLanguage(lang);
          updateUser({ language: lang });
        })
        .catch(() => {
          toast.error(SAVE_FAILED_TOAST[lang]);
        });
    },
    [token, serverKnownLanguage, updateUser],
  );

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: translations[language] }}
    >
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
