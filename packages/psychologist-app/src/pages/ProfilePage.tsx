import { useState } from "react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { useNavigate } from "react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { updateProfile } from "../api/auth.js";
import type { Language } from "@tirek/shared/i18n";
import {
  UserCircle,
  Mail,
  Shield,
  Globe,
  LogOut,
  Check,
  Pencil,
  X,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

export function ProfilePage() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");

  const saveMutation = useMutation({
    mutationFn: () => updateProfile({ name: editName }),
    onSuccess: (data) => {
      updateUser({ name: data.name });
      setEditing(false);
      toast.success(t.common.saved);
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  function handleLogout() {
    logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditing(true);
  };

  const languages: { code: Language; label: string }[] = [
    { code: "ru", label: "Русский" },
    { code: "kz", label: "Қазақша" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-text-main">{t.profile.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Identity column (≈40%) */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-5">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand to-brand-deep text-white flex items-center justify-center text-2xl font-bold shadow-md">
                {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
              </div>
              <h2 className="mt-4 text-lg font-bold text-text-main">
                {user?.name ?? "Psychologist"}
              </h2>
              <p className="text-sm text-text-light">
                {user?.role === "psychologist"
                  ? t.psychologist.role ?? "School Psychologist"
                  : user?.role ?? ""}
              </p>
            </div>

            {!editing ? (
              <div className="mt-5 space-y-2">
                <InfoRow
                  icon={UserCircle}
                  label={t.auth.name}
                  value={user?.name ?? "—"}
                />
                <InfoRow
                  icon={Mail}
                  label={t.auth.email}
                  value={user?.email ?? "—"}
                />
                <InfoRow
                  icon={Shield}
                  label={t.psychologist.role ?? "Role"}
                  value={user?.role ?? "—"}
                />

                <button
                  onClick={startEdit}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand/15"
                >
                  <Pencil size={14} />
                  {t.common.edit}
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-text-light mb-1.5 uppercase tracking-wide">
                    {t.auth.name}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-input-border px-4 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-text-light hover:bg-surface-hover transition-colors"
                  >
                    <X size={14} />
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !editName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    {t.common.save}
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Settings column (≈60%) */}
        <section className="lg:col-span-7 space-y-4">
          {/* Schedule */}
          <button
            onClick={() => navigate("/office-hours")}
            className="w-full bg-surface rounded-2xl border border-border-light shadow-sm p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-brand-deep" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-main">
                {t.officeHours.pageTitle}
              </p>
            </div>
            <ChevronRight size={18} className="text-text-light shrink-0" />
          </button>

          {/* Language */}
          <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-text-light" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-text-light">
                {t.profile.language}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-colors",
                    language === lang.code
                      ? "border-primary bg-brand-soft text-brand-deep"
                      : "border-border text-text-light hover:border-text-light/40",
                  )}
                >
                  {language === lang.code && <Check size={14} />}
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danger */}
          <div className="bg-surface rounded-2xl border border-danger/15 shadow-sm p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-danger mb-1">
              {t.psychologist.studentDetail.dangerZone}
            </h2>
            <p className="text-xs text-text-light mb-4">
              {t.auth.logout}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-danger/30 text-danger
                text-sm font-semibold hover:bg-danger/5 transition-colors"
            >
              <LogOut size={16} />
              {t.auth.logout}
            </button>
          </div>
        </section>
      </div>
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
    <div className="flex items-center gap-3 py-2 border-b border-border-light last:border-0">
      <Icon size={14} className="text-text-light shrink-0" />
      <span className="text-xs text-text-light w-24 uppercase tracking-wide font-medium">
        {label}
      </span>
      <span className="text-sm font-medium text-text-main truncate">
        {value}
      </span>
    </div>
  );
}
