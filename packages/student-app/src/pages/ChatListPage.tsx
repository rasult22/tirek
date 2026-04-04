import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageCircle, ArrowLeft, Clock } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { chatApi } from "../api/chat.js";
import { AppLayout } from "../components/ui/AppLayout.js";

const MODE_EMOJI: Record<string, string> = {
  talk: "💬",
  problem: "🤔",
  exam: "📚",
  discovery: "🔮",
};

export function ChatListPage() {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: chatApi.sessions,
  });

  const modeLabels: Record<string, string> = {
    talk: t.chat.modeTalk,
    problem: t.chat.modeProblem,
    exam: t.chat.modeExam,
    discovery: t.chat.modeDiscovery,
  };

  const newChatMutation = useMutation({
    mutationFn: (mode: string) => chatApi.create(mode),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      navigate(`/chat/${session.id}`);
    },
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="flex-1 text-xl font-bold text-text-main">{t.chat.history}</h1>
        </div>

        {/* New chat button */}
        <button
          onClick={() => navigate("/chat/new")}
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

          {sessions?.data?.length === 0 && (
            <div className="py-10 text-center">
              <MessageCircle size={40} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}

          {sessions?.data?.map((session) => (
            <button
              key={session.id}
              onClick={() => navigate(`/chat/${session.id}`)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-xl">
                {MODE_EMOJI[session.mode] ?? "💬"}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-text-main">{modeLabels[session.mode]}</p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-text-light">
                  <Clock size={12} />
                  {formatDate(session.lastMessageAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
