import { useNavigate } from "react-router";
import { ArrowLeft, LogOut, Globe, User } from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import type { Language } from "@tirek/shared";

const AVATAR_MAP: Record<string, string> = {
  "avatar-1": "\uD83D\uDE0A",
  "avatar-2": "\uD83E\uDD29",
  "avatar-3": "\uD83E\uDD8A",
  "avatar-4": "\uD83D\uDC31",
  "avatar-5": "\uD83D\uDE80",
  "avatar-6": "\uD83C\uDF3B",
};

export function ProfilePage() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.profile.title}</h1>
        </div>

        {/* User card */}
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            {user?.avatarId && AVATAR_MAP[user.avatarId] ? (
              <span className="text-4xl">{AVATAR_MAP[user.avatarId]}</span>
            ) : (
              <User size={36} className="text-primary-dark" />
            )}
          </div>
          <h2 className="mt-3 text-lg font-extrabold text-text-main">{user?.name}</h2>
          <p className="mt-0.5 text-sm text-text-light">{user?.email}</p>
          {user?.grade && (
            <p className="mt-1 text-xs font-bold text-primary-dark">
              {user.grade}{user.classLetter ?? ""}
            </p>
          )}
        </div>

        {/* Language switcher */}
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Globe size={20} className="text-primary-dark" />
            <span className="flex-1 text-sm font-bold text-text-main">{t.profile.language}</span>
          </div>
          <div className="mt-3 flex gap-2">
            {(["ru", "kz"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  language === lang
                    ? "bg-primary-dark text-white shadow-sm"
                    : "bg-gray-100 text-text-light hover:bg-gray-200"
                }`}
              >
                {lang === "ru" ? "\uD83C\uDDF7\uD83C\uDDFA Русский" : "\uD83C\uDDF0\uD83C\uDDFF Қазақша"}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-danger/20 bg-white py-3.5 text-sm font-bold text-danger transition-all hover:bg-danger/5"
        >
          <LogOut size={18} />
          {t.auth.logout}
        </button>
      </div>
    </AppLayout>
  );
}
