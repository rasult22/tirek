import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { registerPsychologist } from "../api/auth.js";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import logoSrc from "../assets/logo.png";

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
      registerPsychologist({
        email,
        password,
        name: `${lastName.trim()} ${firstName.trim()}`,
      }),
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
    <div className="min-h-dvh flex flex-col lg:flex-row bg-bg">
      <aside className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-brand to-brand-deep text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 -z-0 opacity-20">
          <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-white/40 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <img
            src={logoSrc}
            alt="Tirek"
            className="w-12 h-12 rounded-xl shadow-lg"
          />
          <span className="text-2xl font-bold tracking-tight">Tirek</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight mb-4">
            {t.auth.psychologistPanel}
          </h2>
          <p className="text-base text-white/85 leading-relaxed">
            {t.psychologist.dashboard}
          </p>

          <div className="mt-10 space-y-3">
            <FeatureRow icon={Shield} text={t.psychologist.crisis} />
            <FeatureRow icon={MessageCircle} text={t.psychologist.messages} />
            <FeatureRow icon={BookOpen} text={t.psychologist.diagnostics} />
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50 font-medium">
          Tirek &copy; {new Date().getFullYear()}
        </p>
      </aside>

      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8 lg:hidden">
            <img
              src={logoSrc}
              alt="Tirek"
              className="mx-auto w-16 h-16 mb-3 rounded-2xl shadow-lg"
            />
            <h1 className="text-xl font-bold tracking-tight text-text-main">
              Tirek
            </h1>
            <p className="text-xs text-text-light mt-1">
              {t.auth.psychologistPanel}
            </p>
          </div>

          <h2 className="text-2xl font-bold text-text-main mb-6">
            {t.auth.register}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-semibold text-text-light uppercase tracking-wide mb-1.5"
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
                  className="w-full h-11 px-3 rounded-xl border border-input-border bg-surface text-sm
                    text-text-main placeholder:text-text-light/60
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-all"
                  placeholder={t.auth.lastName}
                />
              </div>

              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold text-text-light uppercase tracking-wide mb-1.5"
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
                  className="w-full h-11 px-3 rounded-xl border border-input-border bg-surface text-sm
                    text-text-main placeholder:text-text-light/60
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-all"
                  placeholder={t.auth.firstName}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-text-light uppercase tracking-wide mb-1.5"
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
                className="w-full h-11 px-4 rounded-xl border border-input-border bg-surface text-sm
                  text-text-main placeholder:text-text-light/60
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-all"
                placeholder="email@school.kz"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-text-light uppercase tracking-wide mb-1.5"
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
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-input-border bg-surface text-sm
                    text-text-main placeholder:text-text-light/60
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
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
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        password.length >= 1
                          ? password.length >= 8
                            ? "bg-success"
                            : password.length >= 6
                              ? "bg-warning"
                              : "bg-danger"
                          : "bg-border-light"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        password.length >= 6
                          ? password.length >= 8
                            ? "bg-success"
                            : "bg-warning"
                          : "bg-border-light"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        password.length >= 8 ? "bg-success" : "bg-border-light"
                      }`}
                    />
                  </div>
                  {password.length < 6 && (
                    <span className="text-[10px] font-medium text-danger">
                      {t.auth.passwordTooShort}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-text-light uppercase tracking-wide mb-1.5"
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
                className="w-full h-11 px-4 rounded-xl border border-input-border bg-surface text-sm
                  text-text-main placeholder:text-text-light/60
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-all"
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs font-medium text-danger">
                  {t.auth.passwordsDoNotMatch}
                </p>
              )}
            </div>

            {mutation.isError && (
              <div className="p-3 rounded-xl bg-danger/8 border border-danger/15 text-danger text-sm font-medium">
                {t.auth.invalidCredentials}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || mutation.isPending}
              className="btn-press w-full h-11 rounded-xl bg-primary text-white text-sm font-bold
                hover:bg-primary-dark
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all flex items-center justify-center gap-2
                shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25"
            >
              {mutation.isPending && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {t.auth.register}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-light">
            {t.auth.alreadyHaveAccount}{" "}
            <Link
              to="/login"
              className="font-bold text-primary-dark hover:underline"
            >
              {t.auth.login}
            </Link>
          </p>

          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setLanguage("ru")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                language === "ru"
                  ? "bg-brand-soft text-brand-deep"
                  : "text-text-light hover:text-text-main"
              }`}
            >
              Русский
            </button>
            <button
              onClick={() => setLanguage("kz")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                language === "kz"
                  ? "bg-brand-soft text-brand-deep"
                  : "text-text-light hover:text-text-main"
              }`}
            >
              Қазақша
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  text,
}: {
  icon: typeof Shield;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <span className="text-base font-semibold">{text}</span>
    </div>
  );
}
