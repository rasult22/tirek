import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useT } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { login } from "../api/auth.js";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate("/", { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
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
            Panel psychologist
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card-elevated rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-text-main mb-6">
            {t.auth.login}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-border-light bg-surface/80 text-sm
                    text-text-main placeholder:text-text-light/60
                    transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-light hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-right text-xs text-text-light cursor-default opacity-60 mt-1">
                {t.auth.forgotPassword}
              </p>
            </div>

            {/* Error */}
            {loginMutation.isError && (
              <div className="p-3 rounded-xl bg-danger/8 border border-danger/15 text-danger text-sm font-medium">
                {t.auth.invalidCredentials}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="btn-press w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all flex items-center justify-center gap-2
                shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20"
            >
              {loginMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {t.auth.login}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-light/60 font-medium mt-8">
          Tirek &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
