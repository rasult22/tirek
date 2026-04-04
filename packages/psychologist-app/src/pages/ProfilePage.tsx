import { useT, useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Language } from "@tirek/shared/i18n";
import {
  UserCircle,
  Mail,
  Shield,
  Globe,
  LogOut,
  Check,
} from "lucide-react";
import { clsx } from "clsx";

export function ProfilePage() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleLogout() {
    logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  const languages: { code: Language; label: string }[] = [
    { code: "ru", label: "Русский" },
    { code: "kz", label: "Қазақша" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-main">{t.profile.title}</h1>

      {/* User info card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-main">
              {user?.name ?? "Psychologist"}
            </h2>
            <p className="text-sm text-text-light">
              {user?.role === "psychologist"
                ? "School Psychologist"
                : user?.role ?? ""}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <InfoRow
            icon={UserCircle}
            label={t.auth.name}
            value={user?.name ?? "\u2014"}
          />
          <InfoRow
            icon={Mail}
            label={t.auth.email}
            value={user?.email ?? "\u2014"}
          />
          <InfoRow
            icon={Shield}
            label="Role"
            value={user?.role ?? "\u2014"}
          />
        </div>
      </div>

      {/* Language switcher */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-text-light" />
          <h2 className="text-base font-semibold text-text-main">
            {t.profile.language}
          </h2>
        </div>
        <div className="flex gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                language === lang.code
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-text-light hover:border-gray-300",
              )}
            >
              {language === lang.code && <Check size={14} />}
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-danger/30 text-danger
          text-sm font-semibold hover:bg-danger/5 transition-colors"
      >
        <LogOut size={16} />
        {t.auth.logout}
      </button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <Icon size={16} className="text-text-light shrink-0" />
      <span className="text-sm text-text-light w-32">{label}</span>
      <span className="text-sm font-medium text-text-main">{value}</span>
    </div>
  );
}
