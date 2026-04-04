import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LogOut, Globe, User, Pencil, Check, X } from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { authApi } from "../api/auth.js";
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

const AVATAR_IDS = Object.keys(AVATAR_MAP);

export function ProfilePage() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editAvatar, setEditAvatar] = useState(user?.avatarId ?? "");

  const saveMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ name: editName, avatarId: editAvatar || null }),
    onSuccess: (data) => {
      updateUser({ name: data.name, avatarId: data.avatarId });
      setEditing(false);
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditAvatar(user?.avatarId ?? "");
    setEditing(true);
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
        {!editing ? (
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
            <button
              onClick={startEdit}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary-dark transition-all hover:bg-primary/20"
            >
              <Pencil size={14} />
              {t.common.edit}
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-main mb-4">{t.common.edit}</h3>

            {/* Name input */}
            <label className="block text-xs font-bold text-text-light mb-1">{t.auth.name}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none"
            />

            {/* Avatar picker */}
            <label className="block text-xs font-bold text-text-light mt-4 mb-2">{t.auth.selectAvatar}</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => setEditAvatar(id)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all ${
                    editAvatar === id ? "bg-primary/20 ring-2 ring-primary" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {AVATAR_MAP[id]}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-text-light transition-all hover:bg-gray-50"
              >
                <X size={14} />
                {t.common.cancel}
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editName.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-dark py-3 text-sm font-bold text-white transition-all hover:bg-primary disabled:opacity-50"
              >
                <Check size={14} />
                {t.common.save}
              </button>
            </div>
          </div>
        )}

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
