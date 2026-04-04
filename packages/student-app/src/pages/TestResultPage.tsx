import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Wind, MessageCircle } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { testsApi } from "../api/tests.js";
import type { SessionResult } from "../api/tests.js";
import type { Severity } from "@tirek/shared";

const SEVERITY_CONFIG: Record<Severity, { emoji: string; bg: string; border: string }> = {
  minimal: { emoji: "\uD83D\uDE0A", bg: "bg-green-50", border: "border-green-200" },
  mild: { emoji: "\uD83D\uDE42", bg: "bg-yellow-50", border: "border-yellow-200" },
  moderate: { emoji: "\uD83E\uDD14", bg: "bg-orange-50", border: "border-orange-200" },
  severe: { emoji: "\uD83E\uDD17", bg: "bg-red-50", border: "border-red-200" },
};

export function TestResultPage() {
  const t = useT();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery<SessionResult>({
    queryKey: ["test", "result", sessionId],
    queryFn: () => testsApi.session(sessionId!),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-light">{t.common.error}</p>
      </div>
    );
  }

  const sev = result.severity ?? "minimal";
  const config = SEVERITY_CONFIG[sev];
  const resultMessages: Record<Severity, string> = {
    minimal: t.tests.resultGood,
    mild: t.tests.resultMild,
    moderate: t.tests.resultModerate,
    severe: t.tests.resultSevere,
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        {/* Result card */}
        <div className={`rounded-3xl border-2 ${config.border} ${config.bg} p-8 text-center`}>
          <span className="text-6xl">{config.emoji}</span>
          <h2 className="mt-4 text-xl font-extrabold text-text-main">{t.tests.result}</h2>
          <p className="mt-4 text-sm leading-relaxed text-text-main">
            {resultMessages[sev]}
          </p>
          {result.message && (
            <p className="mt-3 text-xs leading-relaxed text-text-light">
              {result.message}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          {(sev === "moderate" || sev === "severe") && (
            <Link
              to="/chat/new"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30"
            >
              <MessageCircle size={18} />
              {t.chat.title}
            </Link>
          )}
          {(sev === "mild" || sev === "moderate") && (
            <Link
              to="/exercises"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary/20 py-3.5 text-sm font-bold text-secondary"
            >
              <Wind size={18} />
              {t.exercises.title}
            </Link>
          )}
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-text-main shadow-sm"
          >
            <Home size={18} />
            {t.nav.home}
          </button>
        </div>
      </div>
    </div>
  );
}
