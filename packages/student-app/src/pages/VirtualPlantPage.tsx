import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { plantApi } from "../api/plant.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";

const STAGE_EMOJI = ["🌱", "🌿", "🌳", "🌸"] as const;
const STAGE_BG = [
  "from-lime-100 to-green-50",
  "from-green-100 to-emerald-50",
  "from-emerald-100 to-teal-50",
  "from-pink-100 to-rose-50",
] as const;

function stageName(stage: number, t: ReturnType<typeof useT>["plant"]) {
  if (stage === 1) return t.sprout;
  if (stage === 2) return t.bush;
  if (stage === 3) return t.tree;
  return t.bloomingTree;
}

export function VirtualPlantPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const { data: plant, isError, refetch } = useQuery({
    queryKey: ["plant"],
    queryFn: plantApi.get,
  });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saved, setSaved] = useState(false);

  const renameMutation = useMutation({
    mutationFn: (name: string) => plantApi.rename(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant"] });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isError) {
    return (
      <AppLayout>
        <ErrorState onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  if (!plant) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center pt-32 text-text-light">
          {t.common.loading}
        </div>
      </AppLayout>
    );
  }

  const stageIdx = plant.stage - 1;
  const emoji = STAGE_EMOJI[stageIdx];
  const bg = STAGE_BG[stageIdx];
  const progressPercent =
    plant.stage >= 4
      ? 100
      : Math.round(
          ((plant.growthPoints - [0, 50, 150, 300][stageIdx]) /
            (plant.nextStageThreshold - [0, 50, 150, 300][stageIdx])) *
            100,
        );

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-extrabold text-text-main">{t.plant.title}</h1>
        </div>

        {/* Plant illustration */}
        <div
          className={`mt-6 flex flex-col items-center rounded-3xl bg-gradient-to-br ${bg} p-8 ${
            plant.isSleeping ? "opacity-60 grayscale-[40%]" : ""
          }`}
        >
          <div className="text-8xl leading-none transition-all duration-500">
            {emoji}
          </div>
          <div className="mt-4 text-lg font-extrabold text-text-main">
            {plant.name ?? t.plant.unnamed}
          </div>
          <div className="mt-1 text-sm font-medium text-text-light">
            {stageName(plant.stage, t.plant)}
          </div>
          {plant.isSleeping && (
            <div className="mt-3 rounded-xl bg-surface/70 px-4 py-2 text-center text-xs font-medium text-text-light">
              💤 {t.plant.sleeping}
            </div>
          )}
        </div>

        {/* Name editing */}
        <div className="mt-5 rounded-2xl bg-surface p-4 shadow-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-light">
            {t.plant.nameLabel}
          </div>
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                placeholder={t.plant.namePlaceholder}
                autoFocus
              />
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50"
                onClick={() => renameMutation.mutate(editName)}
                disabled={!editName.trim() || renameMutation.isPending}
              >
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-main">
                {plant.name ?? t.plant.unnamed}
              </span>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-text-light transition-colors hover:bg-surface-hover"
                onClick={() => {
                  setEditName(plant.name ?? "");
                  setEditing(true);
                }}
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
          {saved && (
            <div className="mt-2 text-xs font-medium text-secondary">
              ✓ {t.plant.nameSaved}
            </div>
          )}
        </div>

        {/* Growth stats */}
        <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-text-light">
            {t.plant.growthPoints}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-green-600">
                {plant.growthPoints}
              </span>
              {plant.stage < 4 && (
                <span className="text-xs text-text-light">
                  {t.plant.pointsToNext}: {plant.pointsToNextStage}
                </span>
              )}
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, 3)}%` }}
              />
            </div>
          </div>

          {/* Stage indicator */}
          <div className="flex justify-between">
            {STAGE_EMOJI.map((em, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-1 ${
                  i <= stageIdx ? "opacity-100" : "opacity-30"
                }`}
              >
                <span className="text-2xl">{em}</span>
                <span className="text-[10px] font-medium text-text-light">
                  {i === 0 && t.plant.sprout}
                  {i === 1 && t.plant.bush}
                  {i === 2 && t.plant.tree}
                  {i === 3 && t.plant.bloomingTree}
                </span>
              </div>
            ))}
          </div>

          {plant.stage >= 4 && (
            <div className="mt-3 text-center text-sm font-bold text-green-600">
              🎉 {t.plant.maxStage}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
