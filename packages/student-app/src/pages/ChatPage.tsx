import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useT } from "../hooks/useLanguage.js";
import { chatApi } from "../api/chat.js";
import type { ChatMessage } from "@tirek/shared";

interface ToolCallEvent {
  id: string;
  toolName: string;
}

export function ChatPage() {
  const t = useT();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId ?? null);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", activeSessionId],
    queryFn: () => chatApi.messages(activeSessionId!),
    enabled: !!activeSessionId,
  });

  // Use a ref to track session ID so we don't depend on stale closures
  // and don't trigger re-renders mid-stream
  const sessionRef = useRef<string | null>(activeSessionId);
  sessionRef.current = activeSessionId;

  const handleStream = useCallback(async (content: string) => {
    let sid = sessionRef.current;
    let isNewSession = false;

    // If no session yet — create one first
    if (!sid) {
      const session = await chatApi.create("general");
      sid = session.id;
      isNewSession = true;
      // Store in ref immediately so subsequent logic uses it,
      // but defer state/URL updates until after stream completes
      sessionRef.current = sid;
      setActiveSessionId(sid);
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
    }

    // Optimistic update: show user message immediately
    queryClient.setQueryData(
      ["chat", "messages", sid],
      (old: { data: ChatMessage[] } | undefined) => ({
        data: [
          ...(old?.data ?? []),
          { id: `temp-${Date.now()}`, sessionId: sid, role: "user" as const, content, createdAt: new Date().toISOString() },
        ],
      }),
    );

    setIsStreaming(true);
    setStreamingText("");
    setToolCalls([]);

    try {
      const res = await chatApi.streamMessage(sid, content);
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
            } else if (payload.type === "tool_call") {
              setToolCalls((prev) => [
                ...prev,
                { id: `tc-${Date.now()}`, toolName: payload.toolName },
              ]);
            } else if (payload.type === "done" || payload.type === "error") {
              setStreamingText("");
              setIsStreaming(false);
              queryClient.invalidateQueries({ queryKey: ["chat", "messages", sid] });
            }
          } catch {}
        }
      }
    } catch {
      setStreamingText("");
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", sid] });
      toast.error(t.common.sendFailed);
    }

    // Update URL after stream is complete to avoid React Router remounting
    if (isNewSession) {
      window.history.replaceState(null, "", `/chat/${sid}`);
    }
  }, [queryClient, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
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

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-light bg-surface/90 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate("/chat/history")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-secondary"
        >
          <ArrowLeft size={18} className="text-text-main" />
        </button>
        <h1 className="flex-1 text-base font-bold text-text-main">{t.chat.title}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md space-y-3">
          {(!messages?.data || messages.data.length === 0) && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-4xl">👋</div>
              <p className="text-sm text-text-light">{t.chat.emptyState ?? "Напиши мне — я тут, чтобы поговорить!"}</p>
            </div>
          )}
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
          {toolCalls.map((tc) => (
            <div key={tc.id} className="flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 dark:bg-emerald-900/30">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {t.chat.psychologistNotified}
                </span>
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
