import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, MessageSquare, HelpCircle, BookOpen, Compass } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { chatApi } from "../api/chat.js";
import type { ChatMessage } from "@tirek/shared";

const MODE_CONFIG = [
  { mode: "talk", icon: MessageSquare, bgClass: "bg-primary/15", iconClass: "text-primary-dark" },
  { mode: "problem", icon: HelpCircle, bgClass: "bg-accent/20", iconClass: "text-accent" },
  { mode: "exam", icon: BookOpen, bgClass: "bg-info/20", iconClass: "text-info" },
  { mode: "discovery", icon: Compass, bgClass: "bg-secondary/20", iconClass: "text-secondary" },
] as const;

export function ChatPage() {
  const t = useT();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isNew = sessionId === "new";
  const [activeSessionId, setActiveSessionId] = useState<string | null>(isNew ? null : sessionId ?? null);
  const [input, setInput] = useState("");

  const modeLabels: Record<string, { title: string; desc: string }> = {
    talk: { title: t.chat.modeTalk, desc: t.chat.modeTalkDesc },
    problem: { title: t.chat.modeProblem, desc: t.chat.modeProblemDesc },
    exam: { title: t.chat.modeExam, desc: t.chat.modeExamDesc },
    discovery: { title: t.chat.modeDiscovery, desc: t.chat.modeDiscoveryDesc },
  };

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", activeSessionId],
    queryFn: () => chatApi.messages(activeSessionId!),
    enabled: !!activeSessionId,
  });

  const createMutation = useMutation({
    mutationFn: (mode: string) => chatApi.create(mode),
    onSuccess: (session) => {
      setActiveSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      window.history.replaceState(null, "", `/chat/${session.id}`);
    },
  });

  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStream = useCallback(async (content: string) => {
    if (!activeSessionId) return;
    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await chatApi.streamMessage(activeSessionId, content);
      if (!res.body) throw new Error("No stream body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.type === "token") {
              accumulated += payload.content;
              setStreamingText(accumulated);
            } else if (payload.type === "done" || payload.type === "error") {
              setStreamingText("");
              setIsStreaming(false);
              queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeSessionId] });
            }
          } catch {}
        }
      }
    } catch {
      setStreamingText("");
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeSessionId] });
    }
  }, [activeSessionId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.send(activeSessionId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeSessionId] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim() || !activeSessionId || isStreaming) return;
    const content = input.trim();
    setInput("");
    handleStream(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mode selector for new chat
  if (isNew && !activeSessionId) {
    return (
      <div className="flex min-h-screen flex-col bg-bg">
        <div className="flex items-center gap-3 px-5 pt-6">
          <button
            onClick={() => navigate("/chat")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.chat.selectMode}</h1>
        </div>

        <div className="mx-auto mt-6 w-full max-w-md space-y-3 px-5">
          {MODE_CONFIG.map(({ mode, icon: Icon, bgClass, iconClass }) => (
            <button
              key={mode}
              onClick={() => createMutation.mutate(mode)}
              disabled={createMutation.isPending}
              className="flex w-full items-center gap-4 rounded-2xl bg-surface p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgClass}`}>
                <Icon size={24} className={iconClass} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-text-main">{modeLabels[mode].title}</p>
                <p className="mt-0.5 text-xs text-text-light">{modeLabels[mode].desc}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-sm px-6 text-center text-xs leading-relaxed text-text-light">
          {t.chat.disclaimer}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-light bg-surface/90 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate("/chat")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-secondary"
        >
          <ArrowLeft size={18} className="text-text-main" />
        </button>
        <h1 className="text-base font-bold text-text-main">{t.chat.title}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md space-y-3">
          {messages?.data?.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-br-md bg-primary-dark text-white"
                    : "rounded-bl-md bg-surface text-text-main shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-sm leading-relaxed text-text-main shadow-sm">
                {streamingText}
                <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-gray-400" />
              </div>
            </div>
          )}
          {isStreaming && !streamingText && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-surface px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border-light bg-surface/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.inputPlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border px-4 py-3 text-sm text-text-main placeholder-text-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-dark text-white transition-all disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
