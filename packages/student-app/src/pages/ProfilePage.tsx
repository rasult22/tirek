import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LogOut, Globe, User, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { authApi } from "../api/auth.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import type { Language } from "@tirek/shared";
import {
  getDisplayName,
  setDisplayName,
  useDisplayName,
} from "../lib/displayName.js";

const AVATAR_MAP: Record<string, string> = {
  "avatar-1": "\u{1F60A}",
  "avatar-2": "\u{1F929}",
  "avatar-3": "\u{1F98A}",
  "avatar-4": "\u{1F431}",
  "avatar-5": "\u{1F680}",
  "avatar-6": "\u{1F33B}",
};

const AVATAR_IDS = Object.keys(AVATAR_MAP);

export function ProfilePage() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const displayName = useDisplayName(user?.name);

  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState(getDisplayName());
  const [editAvatar, setEditAvatar] = useState(user?.avatarId ?? "");

  const saveMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ avatarId: editAvatar || null }),
    onSuccess: (data) => {
      updateUser({ avatarId: data.avatarId });
      setDisplayName(editNickname);
      setEditing(false);
      toast.success(t.common.saved);
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const handleLogout = () => {
    setDisplayName("");
    logout();
    navigate("/login");
  };

  const startEdit = () => {
    setEditNickname(getDisplayName());
    setEditAvatar(user?.avatarId ?? "");
    setEditing(true);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-press flex h-10 w-10 items-center justify-center rounded-xl glass-card"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.profile.title}</h1>
        </div>

        {/* User card */}
        {!editing ? (
          <div className="mt-6 flex flex-col items-center glass-card-elevated rounded-2xl p-7">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10">
              {user?.avatarId && AVATAR_MAP[user.avatarId] ? (
                <span className="text-4xl drop-shadow-sm">{AVATAR_MAP[user.avatarId]}</span>
              ) : (
                <User size={36} className="text-primary-dark" />
              )}
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-text-main">{displayName}</h2>
            <p className="mt-0.5 text-sm text-text-light">{user?.email}</p>
            {user?.grade && (
              <p className="mt-1.5 text-xs font-bold text-primary-dark bg-primary/8 px-3 py-1 rounded-full">
                {user.grade}{user.classLetter ?? ""}
              </p>
            )}
            <button
              onClick={startEdit}
              className="btn-press mt-5 flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary-dark transition-all hover:bg-primary/15"
            >
              <Pencil size={14} />
              {t.common.edit}
            </button>
          </div>
        ) : (
          <div className="mt-6 glass-card-elevated rounded-2xl p-6">
            <h3 className="text-sm font-bold text-text-main mb-4">{t.common.edit}</h3>

            <label className="block text-xs font-bold text-text-light mb-1.5">{t.auth.nicknameLabel}</label>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              maxLength={32}
              placeholder={user?.name ?? ""}
              className="w-full rounded-xl border border-border-light bg-surface/60 px-4 py-3 text-sm text-text-main transition-all"
            />
            <p className="mt-1 text-[11px] text-text-light">
              {t.auth.nicknameHint}
            </p>

            <label className="block text-xs font-bold text-text-light mt-5 mb-2">{t.auth.selectAvatar}</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => setEditAvatar(id)}
                  className={`btn-press flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all ${
                    editAvatar === id ? "bg-primary/15 ring-2 ring-primary glow-primary" : "bg-surface-secondary hover:bg-surface-hover"
                  }`}
                >
                  {AVATAR_MAP[id]}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="btn-press flex-1 flex items-center justify-center gap-2 rounded-xl border border-border-light py-3 text-sm font-bold text-text-light transition-all hover:bg-surface-hover"
              >
                <X size={14} />
                {t.common.cancel}
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn-press flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
              >
                <Check size={14} />
                {t.common.save}
              </button>
            </div>
          </div>
        )}

        {/* Language switcher */}
        <div className="mt-5 glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Globe size={18} className="text-primary-dark" />
            </div>
            <span className="flex-1 text-sm font-bold text-text-main">{t.profile.language}</span>
          </div>
          <div className="mt-3.5 flex gap-2">
            {(["ru", "kz"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`btn-press flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  language === lang
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm"
                    : "bg-surface-secondary text-text-light hover:bg-surface-hover"
                }`}
              >
                {lang === "ru" ? "\u{1F1F7}\u{1F1FA} \u0420\u0443\u0441\u0441\u043A\u0438\u0439" : "\u{1F1F0}\u{1F1FF} \u049A\u0430\u0437\u0430\u049B\u0448\u0430"}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/20 bg-danger/5 py-3.5 text-sm font-bold text-danger transition-all hover:bg-danger/10"
        >
          <LogOut size={18} />
          {t.auth.logout}
        </button>
      </div>
    </AppLayout>
  );
}
