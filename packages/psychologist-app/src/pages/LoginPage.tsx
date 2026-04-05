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
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">
            Tirek
          </h1>
          <p className="text-sm text-text-light mt-1">
            Panel psychologist
          </p>
        </div>

        {/* Login card */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-text-main mb-6">
            {t.auth.login}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-main mb-1.5"
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
                className="w-full h-11 px-3.5 rounded-lg border border-input-border bg-surface text-sm
                  text-text-main placeholder:text-text-light
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors"
                placeholder="email@school.kz"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-main mb-1.5"
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
                  className="w-full h-11 px-3.5 pr-10 rounded-lg border border-input-border bg-surface text-sm
                    text-text-main placeholder:text-text-light
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-main"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {loginMutation.isError && (
              <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
                {t.auth.invalidCredentials}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-11 rounded-lg bg-primary text-white text-sm font-semibold
                hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2"
            >
              {loginMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {t.auth.login}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-light mt-6">
          Tirek &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
