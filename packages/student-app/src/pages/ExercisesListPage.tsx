import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Wind, Loader2 } from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { exercisesApi } from "../api/exercises.js";

const EMOJI_MAP: Record<string, { emoji: string; iconBg: string }> = {
  "square-breathing": { emoji: "\u2B1B", iconBg: "bg-blue-100" },
  "breathing-478": { emoji: "\u{1F300}", iconBg: "bg-teal-100" },
  diaphragmatic: { emoji: "\u{1F388}", iconBg: "bg-emerald-100" },
  "grounding-54321": { emoji: "\u{1F33F}", iconBg: "bg-green-100" },
  pmr: { emoji: "\u{1F4AA}", iconBg: "bg-amber-100" },
  "thought-diary": { emoji: "\u{1F4D3}", iconBg: "bg-violet-100" },
};

export function ExercisesListPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesApi.list,
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-press flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border-light shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.exercises.title}</h1>
        </div>

        {/* Hero illustration */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-100">
            <Wind size={48} className="text-teal-700" strokeWidth={1.5} />
          </div>
        </div>

        {/* Exercise cards */}
        <div className="mt-6 space-y-3 stagger-children">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}
          {exercises?.map((ex) => {
            const visual = EMOJI_MAP[ex.slug] ?? { emoji: "\u{1F33F}", iconBg: "bg-gray-100" };
            const name = language === "kz" && ex.nameKz ? ex.nameKz : ex.nameRu;
            return (
              <button
                key={ex.id}
                onClick={() => navigate(`/exercises/${ex.slug}`)}
                className="btn-press flex w-full items-center gap-4 rounded-2xl bg-white border border-border-light p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.iconBg}`}>
                  <span className="text-2xl">{visual.emoji}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-text-main">{name}</p>
                  <p className="mt-0.5 text-xs text-text-light line-clamp-2">{ex.description}</p>
                </div>
                <ArrowRight size={18} className="text-text-light" />
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
