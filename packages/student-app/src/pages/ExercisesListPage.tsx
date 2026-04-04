import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Wind } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";

const EXERCISES = [
  {
    id: "square-breathing",
    emoji: "\u2B1B",
    bg: "bg-primary/15",
  },
  {
    id: "breathing-478",
    emoji: "\uD83C\uDF00",
    bg: "bg-accent/20",
  },
  {
    id: "diaphragmatic",
    emoji: "\uD83C\uDF88",
    bg: "bg-secondary/20",
  },
];

export function ExercisesListPage() {
  const t = useT();
  const navigate = useNavigate();

  const exerciseData: Record<string, { name: string; desc: string }> = {
    "square-breathing": { name: t.exercises.squareBreathing, desc: t.exercises.squareBreathingDesc },
    "breathing-478": { name: t.exercises.breathing478, desc: t.exercises.breathing478Desc },
    diaphragmatic: { name: t.exercises.diaphragmatic, desc: t.exercises.diaphragmaticDesc },
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
          {EXERCISES.map((ex) => {
            const data = exerciseData[ex.id];
            return (
              <button
                key={ex.id}
                onClick={() => navigate(`/exercises/${ex.id}`)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${ex.bg}`}>
                  <span className="text-2xl">{ex.emoji}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-text-main">{data.name}</p>
                  <p className="mt-1 text-xs text-text-light">{data.desc}</p>
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
