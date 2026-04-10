import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, MessageCircle, Clock } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { chatApi } from "../api/chat.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";

export function ChatListPage() {
  const t = useT();
  const navigate = useNavigate();

  const { data: sessions, isLoading, isError, refetch } = useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: chatApi.sessions,
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  // Show only the 6 most recent sessions
  const recentSessions = sessions?.data?.slice(0, 6) ?? [];

  if (isError) {
    return (
      <AppLayout>
        <ErrorState onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h1 className="flex-1 text-xl font-bold text-text-main">{t.chat.title}</h1>
        </div>

        {/* New chat button */}
        <button
          onClick={() => navigate("/chat")}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl"
        >
          <Plus size={18} />
          {t.chat.newChat}
        </button>

        {/* Sessions list */}
        <div className="mt-5 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <span className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          )}

          {recentSessions.length === 0 && !isLoading && (
            <div className="py-10 text-center">
              <MessageCircle size={40} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}

          {recentSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => navigate(`/chat/${session.id}`)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl">
                💬
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-text-main">
                  {session.preview || t.chat.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-text-light">
                  <Clock size={12} />
                  {formatDate(session.lastMessageAt || session.startedAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
