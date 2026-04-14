import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { registerPsychologist } from "../api/auth.js";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export function RegisterPage() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      registerPsychologist({ email, password, name: `${lastName.trim()} ${firstName.trim()}` }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate("/", { replace: true });
    },
  });

  const isValid =
    lastName.trim().length > 0 &&
    firstName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) mutation.mutate();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark mb-4 shadow-lg shadow-primary/15">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            Tirek
          </h1>
          <p className="text-sm text-text-light mt-1">
            {t.auth.psychologistPanel}
          </p>
        </div>

        {/* Register card */}
        <div className="glass-card-elevated rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-text-main mb-6">
            {t.auth.register}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-text-main mb-1.5"
              >
                {t.auth.lastName}
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="w-full h-11 px-4 rounded-xl border border-border-light bg-surface/80 text-sm
                  text-text-main placeholder:text-text-light/60
                  transition-all"
                placeholder={t.auth.lastName}
              />
            </div>

            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-text-main mb-1.5"
              >
                {t.auth.firstName}
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className="w-full h-11 px-4 rounded-xl border border-border-light bg-surface/80 text-sm
                  text-text-main placeholder:text-text-light/60
                  transition-all"
                placeholder={t.auth.firstName}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-text-main mb-1.5"
              >
                {t.auth.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 px-4 rounded-xl border border-border-light bg-surface/80 text-sm
                  text-text-main placeholder:text-text-light/60
                  transition-all"
                placeholder="email@school.kz"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-text-main mb-1.5"
              >
                {t.auth.password}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-border-light bg-surface/80 text-sm
                    text-text-main placeholder:text-text-light/60
                    transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-light hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-text-main mb-1.5"
              >
                {t.auth.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full h-11 px-4 rounded-xl border border-border-light bg-surface/80 text-sm
                  text-text-main placeholder:text-text-light/60
                  transition-all"
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs font-medium text-danger">{t.auth.passwordsDoNotMatch}</p>
              )}
            </div>

            {/* Error */}
            {mutation.isError && (
              <div className="p-3 rounded-xl bg-danger/8 border border-danger/15 text-danger text-sm font-medium">
                {t.auth.invalidCredentials}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || mutation.isPending}
              className="btn-press w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all flex items-center justify-center gap-2
                shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20"
            >
              {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {t.auth.register}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-light">
            {t.auth.alreadyHaveAccount}{" "}
            <Link to="/login" className="font-bold text-primary-dark hover:underline">
              {t.auth.login}
            </Link>
          </p>
        </div>

        {/* Language switcher */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setLanguage("ru")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              language === "ru"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-text-light hover:text-text-main"
            }`}
          >
            Русский
          </button>
          <button
            onClick={() => setLanguage("kz")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              language === "kz"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-text-light hover:text-text-main"
            }`}
          >
            Қазақша
          </button>
        </div>

        <p className="text-center text-[11px] text-text-light/60 font-medium mt-4">
          Tirek &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
