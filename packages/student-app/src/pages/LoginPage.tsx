import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoSrc from "../assets/logo.png";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { authApi } from "../api/auth.js";
import { useAuthStore } from "../store/auth-store.js";
import type { Language } from "@tirek/shared";

export function LoginPage() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary/6 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Language toggle */}
      <div className="absolute right-5 top-5">
        <div className="glass-card flex overflow-hidden rounded-xl text-sm font-bold">
          {(["ru", "kz"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`btn-press px-4 py-2 transition-all ${
                language === lang
                  ? "bg-primary text-white"
                  : "text-text-light hover:bg-primary/8"
              }`}
            >
              {lang === "ru" ? "RU" : "KZ"}
            </button>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="mb-10 text-center animate-fade-in-up">
        <img src={logoSrc} alt="Tirek" className="mx-auto mb-5 h-20 w-20 rounded-2xl shadow-lg shadow-primary/25" />
        <h1 className="text-3xl font-extrabold tracking-tight text-text-main">{t.common.appName}</h1>
        <p className="mt-1.5 text-sm text-text-light">{t.onboarding.welcomeDesc}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.email}
            required
            className="w-full rounded-2xl border border-border-light bg-surface/80 py-3.5 pl-12 pr-4 text-sm font-medium text-text-main placeholder-text-light backdrop-blur-sm transition-all"
          />
        </div>

        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.auth.password}
            required
            className="w-full rounded-2xl border border-border-light bg-surface/80 py-3.5 pl-12 pr-12 text-sm font-medium text-text-main placeholder-text-light backdrop-blur-sm transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-light transition-colors hover:text-primary"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <p className="text-right text-xs text-text-light cursor-default opacity-60">
          {t.auth.forgotPassword}
        </p>

        {loginMutation.isError && (
          <div className="rounded-xl bg-danger/8 border border-danger/15 px-4 py-2.5 text-center text-sm font-medium text-danger">
            {t.auth.invalidCredentials}
          </div>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-4 text-sm font-bold text-white glow-primary transition-all hover:shadow-xl disabled:opacity-60"
        >
          {loginMutation.isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <LogIn size={18} />
              {t.auth.login}
            </>
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-8 text-sm text-text-light animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        {t.auth.noAccount}{" "}
        <Link to="/register" className="font-bold text-primary-dark hover:underline">
          {t.auth.register}
        </Link>
      </p>
    </div>
  );
}
