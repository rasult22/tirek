import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Wind, MessageCircle, BookOpen, Phone } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { testsApi } from "../api/tests.js";
import type { SessionResult, SuggestedAction } from "../api/tests.js";
import { ErrorState } from "../components/ui/ErrorState.js";

const ACTION_ICON: Record<SuggestedAction["type"], typeof Wind> = {
  exercise: Wind,
  journal: BookOpen,
  chat: MessageCircle,
  hotline: Phone,
};

function actionLabel(t: ReturnType<typeof useT>, type: SuggestedAction["type"]) {
  switch (type) {
    case "exercise":
      return t.completion.actionBreathing;
    case "journal":
      return t.completion.actionJournal;
    case "chat":
      return t.completion.actionChatPsychologist;
    case "hotline":
      return t.completion.actionHotline;
  }
}

function isExternalLink(deeplink: string) {
  return deeplink.startsWith("tel:") || deeplink.startsWith("http");
}

export function CompletionScreen() {
  const t = useT();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery<SessionResult>({
    queryKey: ["test", "completion", sessionId],
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

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const isSoft = data.requiresSupport;
  const title = isSoft ? t.completion.titleSoft : t.completion.titleNormal;
  const subtitle = isSoft ? t.completion.subtitleSoft : t.completion.subtitleNormal;
  const cardBg = isSoft ? "bg-orange-50" : "bg-green-50";
  const cardBorder = isSoft ? "border-orange-200" : "border-green-200";
  const emoji = isSoft ? "🤗" : "🌱";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className={`rounded-3xl border-2 ${cardBorder} ${cardBg} p-8 text-center`}>
          <span className="text-6xl">{emoji}</span>
          <h2 className="mt-4 text-xl font-extrabold text-text-main">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-light">{subtitle}</p>
        </div>

        <div className="mt-6 space-y-3">
          {data.suggestedActions.map((action) => {
            const Icon = ACTION_ICON[action.type];
            const label = actionLabel(t, action.type);
            const isPrimary = isSoft && (action.type === "chat" || action.type === "hotline");
            const className = isPrimary
              ? "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30"
              : "flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary/20 py-3.5 text-sm font-bold text-secondary";

            if (isExternalLink(action.deeplink)) {
              return (
                <a key={`${action.type}-${action.deeplink}`} href={action.deeplink} className={className}>
                  <Icon size={18} />
                  {label}
                </a>
              );
            }
            return (
              <Link key={`${action.type}-${action.deeplink}`} to={action.deeplink} className={className}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 text-sm font-bold text-text-main shadow-sm"
          >
            <Home size={18} />
            {t.completion.backHome}
          </button>
        </div>
      </div>
    </div>
  );
}
