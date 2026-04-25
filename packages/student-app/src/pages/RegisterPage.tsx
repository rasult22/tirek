import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, User, Mail, Lock, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { authApi } from "../api/auth.js";
import { useAuthStore } from "../store/auth-store.js";
import { setDisplayName } from "../lib/displayName.js";

const AVATARS = [
  { id: "avatar-1", emoji: "😊", bg: "bg-primary/30" },
  { id: "avatar-2", emoji: "🤩", bg: "bg-secondary/40" },
  { id: "avatar-3", emoji: "🦊", bg: "bg-accent/40" },
  { id: "avatar-4", emoji: "🐱", bg: "bg-info/40" },
  { id: "avatar-5", emoji: "🚀", bg: "bg-primary/20" },
  { id: "avatar-6", emoji: "🌻", bg: "bg-secondary/30" },
];

export function RegisterPage() {
  const t = useT();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarId, setAvatarId] = useState("avatar-1");

  const registerMutation = useMutation({
    mutationFn: () => authApi.register({ email, password, inviteCode, avatarId }),
    onSuccess: (data) => {
      if (nickname.trim()) {
        setDisplayName(nickname);
      }
      setAuth(data.token, data.user);
      navigate("/onboarding");
    },
  });

  const canGoNext = () => {
    if (step === 1) return inviteCode.trim().length >= 4;
    if (step === 2) return email.trim() && password.length >= 6 && password === confirmPassword;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else registerMutation.mutate();
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg px-6 pt-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
        ) : (
          <Link
            to="/login"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </Link>
        )}
        <h1 className="text-xl font-bold text-text-main">{t.auth.register}</h1>
      </div>

      {/* Progress */}
      <div className="mt-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary-dark" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="mt-8 flex-1">
        {step === 1 && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/30">
              <KeyRound size={36} className="text-accent" strokeWidth={2} />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-text-main">{t.auth.inviteCode}</h2>
              <p className="mt-1 text-sm text-text-light">{t.auth.enterInviteCode}</p>
            </div>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              className="w-full rounded-2xl border border-border bg-surface py-4 text-center text-lg font-bold tracking-widest text-text-main placeholder-text-light outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              maxLength={10}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.auth.nicknamePlaceholder}
                maxLength={32}
                className="w-full rounded-2xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm font-medium text-text-main placeholder-text-light outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="-mt-2 text-[11px] text-text-light px-1">
              {t.auth.nicknameHint}
            </p>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.email}
                className="w-full rounded-2xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm font-medium text-text-main placeholder-text-light outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.password}
                  className="w-full rounded-2xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm font-medium text-text-main placeholder-text-light outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    <div className={`h-1 flex-1 rounded-full ${password.length >= 1 ? (password.length >= 8 ? "bg-success" : password.length >= 6 ? "bg-warning" : "bg-danger") : "bg-border-light"}`} />
                    <div className={`h-1 flex-1 rounded-full ${password.length >= 6 ? (password.length >= 8 ? "bg-success" : "bg-warning") : "bg-border-light"}`} />
                    <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? "bg-success" : "bg-border-light"}`} />
                  </div>
                  {password.length < 6 && (
                    <span className="text-[10px] font-medium text-danger">{t.auth.passwordTooShort}</span>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.auth.confirmPassword}
                className="w-full rounded-2xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm font-medium text-text-main placeholder-text-light outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs font-medium text-danger">{t.auth.passwordsDoNotMatch}</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-text-main">{t.auth.selectAvatar}</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setAvatarId(av.id)}
                  className={`relative flex h-24 w-full items-center justify-center rounded-2xl transition-all ${av.bg} ${
                    avatarId === av.id
                      ? "ring-3 ring-primary-dark scale-105 shadow-lg"
                      : "hover:scale-102"
                  }`}
                >
                  <span className="text-4xl">{av.emoji}</span>
                  {avatarId === av.id && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-dark">
                      <Check size={14} className="text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {registerMutation.isError && (
        <p className="mb-4 rounded-xl bg-danger/10 px-4 py-2 text-center text-sm font-medium text-danger">
          {t.common.error}
        </p>
      )}

      {/* Next / Submit */}
      <div className="pb-8 pt-4">
        <button
          onClick={handleNext}
          disabled={!canGoNext() || registerMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all disabled:opacity-40"
        >
          {registerMutation.isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : step < 3 ? (
            <>
              {t.common.next}
              <ArrowRight size={18} />
            </>
          ) : (
            <>
              <Check size={18} />
              {t.common.done}
            </>
          )}
        </button>

        {step === 1 && (
          <p className="mt-4 text-center text-sm text-text-light">
            {t.auth.alreadyHaveAccount}{" "}
            <Link to="/login" className="font-bold text-primary-dark hover:underline">
              {t.auth.login}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
