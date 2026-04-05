import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      {/* Language toggle */}
      <div className="absolute right-4 top-4 flex overflow-hidden rounded-full border border-primary/30 bg-surface text-sm font-semibold">
        {(["ru", "kz"] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-4 py-1.5 transition-colors ${
              language === lang ? "bg-primary text-white" : "text-text-light hover:bg-primary/10"
            }`}
          >
            {lang === "ru" ? "RU" : "KZ"}
          </button>
        ))}
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30">
          <span className="text-3xl font-extrabold text-white">T</span>
        </div>
        <h1 className="text-3xl font-extrabold text-text-main">{t.common.appName}</h1>
        <p className="mt-1 text-sm text-text-light">{t.onboarding.welcomeDesc}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.email}
            required
            className="w-full rounded-2xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm font-medium text-text-main placeholder-text-light outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
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
            className="w-full rounded-2xl border border-border bg-surface py-3.5 pl-11 pr-11 text-sm font-medium text-text-main placeholder-text-light outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {loginMutation.isError && (
          <p className="rounded-xl bg-danger/10 px-4 py-2 text-center text-sm font-medium text-danger">
            {t.auth.invalidCredentials}
          </p>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl disabled:opacity-60"
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
      <p className="mt-6 text-sm text-text-light">
        {t.auth.noAccount}{" "}
        <Link to="/register" className="font-bold text-primary-dark hover:underline">
          {t.auth.register}
        </Link>
      </p>
    </div>
  );
}
