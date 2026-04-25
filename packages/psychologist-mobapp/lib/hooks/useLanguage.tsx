import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ru } from "@tirek/shared/i18n";
import { kz } from "@tirek/shared/i18n";
import type { TranslationKeys, Language } from "@tirek/shared/i18n";
import {
  parseLanguage,
  pickInitialLanguage,
  shouldPersistToServer,
} from "@tirek/shared/language-sync";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/auth-store";

const STORAGE_KEY = "tirek-language";
const translations: Record<Language, TranslationKeys> = { ru, kz };

const SAVE_FAILED_TITLE: Record<Language, string> = {
  ru: "Не удалось сохранить язык",
  kz: "Тілді сақтау мүмкін болмады",
};

const SAVE_FAILED_BODY: Record<Language, string> = {
  ru: "Изменение применено локально, но не сохранилось на сервере. Попробуйте позже.",
  kz: "Өзгеріс жергілікті қолданылды, бірақ серверге сақталмады. Кейінірек қайталап көріңіз.",
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

  const [language, setLang] = useState<Language>("ru");
  const [serverKnownLanguage, setServerKnownLanguage] =
    useState<Language | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (cancelled) return;
      const parsed = parseLanguage(saved);
      if (parsed) setLang(parsed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setServerKnownLanguage(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await authApi.me();
        if (cancelled) return;
        const local = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        const decision = pickInitialLanguage({
          server: { ok: true, language: resp?.language },
          local,
          defaultLang: "ru",
        });
        setServerKnownLanguage(decision.language);
        setLang(decision.language);
        if (decision.writeLocal) {
          await AsyncStorage.setItem(STORAGE_KEY, decision.language);
        }
      } catch {
        // Silent fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLang(lang);
      AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
      if (!token) return;
      if (!shouldPersistToServer(serverKnownLanguage, lang)) return;
      authApi
        .updateProfile({ language: lang })
        .then(() => {
          setServerKnownLanguage(lang);
          updateUser({ language: lang });
        })
        .catch(() => {
          Alert.alert(SAVE_FAILED_TITLE[lang], SAVE_FAILED_BODY[lang]);
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
