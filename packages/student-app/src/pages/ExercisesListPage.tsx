import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Wind, Loader2 } from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { exercisesApi } from "../api/exercises.js";

const EMOJI_MAP: Record<string, { emoji: string; bg: string }> = {
  "square-breathing": { emoji: "\u2B1B", bg: "bg-primary/15" },
  "breathing-478": { emoji: "\uD83C\uDF00", bg: "bg-accent/20" },
  diaphragmatic: { emoji: "\uD83C\uDF88", bg: "bg-secondary/20" },
  "grounding-54321": { emoji: "\uD83C\uDF3F", bg: "bg-green-100" },
  pmr: { emoji: "\uD83D\uDCAA", bg: "bg-amber-100" },
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
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.exercises.title}</h1>
        </div>

        {/* Illustration */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary/15">
            <Wind size={48} className="text-secondary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Exercise cards */}
        <div className="mt-6 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}
          {exercises?.map((ex) => {
            const visual = EMOJI_MAP[ex.slug] ?? { emoji: "\uD83C\uDF3F", bg: "bg-gray-100" };
            const name = language === "kz" && ex.nameKz ? ex.nameKz : ex.nameRu;
            return (
              <button
                key={ex.id}
                onClick={() => navigate(`/exercises/${ex.slug}`)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${visual.bg}`}>
                  <span className="text-2xl">{visual.emoji}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-text-main">{name}</p>
                  <p className="mt-1 text-xs text-text-light">{ex.description}</p>
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
