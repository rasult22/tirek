import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Sparkles, Trash2, Loader2, Send } from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { journalApi } from "../api/journal.js";

export function JournalPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: prompt } = useQuery({
    queryKey: ["journal", "prompt"],
    queryFn: journalApi.dailyPrompt,
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal", "list"],
    queryFn: journalApi.list,
  });

  const createMutation = useMutation({
    mutationFn: journalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", "list"] });
      setContent("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: journalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", "list"] });
    },
  });

  const promptText = prompt
    ? language === "kz" ? prompt.kz : prompt.ru
    : "";

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate({
      prompt: promptText || undefined,
      content: content.trim(),
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === "kz" ? "kk-KZ" : "ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.journal.title}</h1>
        </div>

        {/* Daily prompt */}
        {promptText && (
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
              <Sparkles size={14} />
              {t.journal.dailyPrompt}
            </div>
            <p className="text-sm font-medium text-text-main">{promptText}</p>
          </div>
        )}

        {/* New entry form */}
        <div className="mt-5 rounded-2xl bg-surface p-4 shadow-sm">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.journal.placeholder}
            rows={4}
            className="w-full resize-none rounded-xl border-0 bg-surface-secondary p-3 text-sm text-text-main placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="mt-3 flex items-center justify-between">
            {showSuccess && (
              <span className="text-xs font-bold text-secondary">{t.journal.saved}</span>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || createMutation.isPending}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  content.trim()
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {createMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {t.common.save}
              </button>
            </div>
          </div>
        </div>

        {/* Entries list */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-light">
            {t.journal.entries}
          </h2>

          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (!entries?.data || entries.data.length === 0) && (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
                <BookOpen size={32} className="text-accent" strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-sm text-text-light">{t.journal.noEntries}</p>
            </div>
          )}

          <div className="space-y-3 pb-8">
            {entries?.data?.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {entry.prompt && (
                      <p className="mb-1 text-xs font-bold text-accent">{entry.prompt}</p>
                    )}
                    <p className="text-sm text-text-main leading-relaxed">{entry.content}</p>
                    <p className="mt-2 text-xs text-text-light">{formatDate(entry.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg text-text-light transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
