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
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-main">{t.profile.title}</h1>

      {/* User info card */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-main">
              {user?.name ?? "Psychologist"}
            </h2>
            <p className="text-sm text-text-light">
              {user?.role === "psychologist"
                ? t.psychologist.role ?? "School Psychologist"
                : user?.role ?? ""}
            </p>
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Pencil size={14} />
              {t.common.edit}
            </button>
          )}
        </div>

        {!editing ? (
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
              label={t.psychologist.role ?? "Role"}
              value={user?.role ?? "\u2014"}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-light mb-1">{t.auth.name}</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-light hover:bg-surface-hover transition-colors"
              >
                <X size={14} />
                {t.common.cancel}
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editName.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Check size={14} />
                {t.common.save}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My schedule */}
      <button
        onClick={() => navigate("/office-hours")}
        className="w-full bg-surface rounded-xl border border-border shadow-sm p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors text-left"
      >
        <Calendar size={18} className="text-primary shrink-0" />
        <span className="flex-1 text-base font-semibold text-text-main">
          {t.officeHours.pageTitle}
        </span>
        <ChevronRight size={18} className="text-text-light shrink-0" />
      </button>

      {/* Language switcher */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
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
                  : "border-border text-text-light hover:border-gray-300",
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
    <div className="flex items-center gap-3 py-2 border-b border-border-light last:border-0">
      <Icon size={16} className="text-text-light shrink-0" />
      <span className="text-sm text-text-light w-32">{label}</span>
      <span className="text-sm font-medium text-text-main">{value}</span>
    </div>
  );
}
