import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Trash2,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.js";
import { cbtApi } from "../api/cbt.js";
import type { Exercise, ThoughtDiaryData, CbtEntry } from "@tirek/shared";

const STEP_COLORS = [
  "from-blue-400 to-blue-500",
  "from-purple-400 to-purple-500",
  "from-amber-400 to-amber-500",
  "from-rose-400 to-rose-500",
  "from-green-400 to-green-500",
];

const DISTORTION_KEYS = [
  "catastrophizing",
  "blackWhite",
  "mindReading",
  "fortuneTelling",
  "personalization",
  "overgeneralization",
  "shouldStatements",
  "emotionalReasoning",
  "labeling",
  "magnification",
] as const;

export function ThoughtDiaryPage({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [emotionIntensity, setEmotionIntensity] = useState(5);
  const [distortion, setDistortion] = useState("");
  const [alternative, setAlternative] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const { data: history, isError, refetch } = useQuery({
    queryKey: ["cbt", "list", "thought_diary"],
    queryFn: () => cbtApi.list("thought_diary"),
  });

  const createMutation = useMutation({
    mutationFn: cbtApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
      setCompleted(true);
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const deleteMutation = useMutation({
    mutationFn: cbtApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
    },
    onError: () => toast.error(t.common.deleteFailed),
  });

  const steps = [
    {
      label: t.cbt.situation,
      placeholder: t.cbt.situationPlaceholder,
      value: situation,
      set: setSituation,
    },
    {
      label: t.cbt.thought,
      placeholder: t.cbt.thoughtPlaceholder,
      value: thought,
      set: setThought,
    },
    {
      label: t.cbt.emotion,
      placeholder: t.cbt.emotionPlaceholder,
      value: emotion,
      set: setEmotion,
      hasIntensity: true,
    },
    {
      label: t.cbt.distortion,
      placeholder: t.cbt.distortionPlaceholder,
      value: distortion,
      set: setDistortion,
      isDistortion: true,
    },
    {
      label: t.cbt.alternative,
      placeholder: t.cbt.alternativePlaceholder,
      value: alternative,
      set: setAlternative,
    },
  ];

  const currentStep = steps[step];
  const canProceed =
    step === 3 ? true : (currentStep?.value?.trim().length ?? 0) > 0;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      createMutation.mutate({
        type: "thought_diary",
        data: {
          situation,
          thought,
          emotion,
          emotionIntensity,
          distortion: distortion || undefined,
          alternative: alternative || undefined,
        },
      });
    }
  };

  const handleReset = () => {
    setStep(0);
    setSituation("");
    setThought("");
    setEmotion("");
    setEmotionIntensity(5);
    setDistortion("");
    setAlternative("");
    setCompleted(false);
  };

  if (isError) {
    return (
      <AppLayout>
        <ErrorState onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  if (completed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/20">
          <Check size={48} className="text-secondary" />
        </div>
        <h2 className="mt-6 text-xl font-extrabold text-text-main">
          {t.cbt.saved}
        </h2>
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleReset}
            className="rounded-2xl bg-surface px-6 py-3 text-sm font-bold text-text-main shadow-sm"
          >
            {t.common.next}
          </button>
          <button
            onClick={() => navigate("/exercises")}
            className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-lg"
          >
            {t.common.done}
          </button>
        </div>
      </div>
    );
  }

  if (showHistory) {
    const entries = history?.data ?? [];
    return (
      <AppLayout>
        <div className="mx-auto max-w-md px-5 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
            >
              <ArrowLeft size={20} className="text-text-main" />
            </button>
            <h1 className="text-lg font-bold text-text-main">
              {t.cbt.entries}
            </h1>
          </div>
          <div className="mt-5 space-y-4">
            {entries.length === 0 && (
              <p className="py-8 text-center text-sm text-text-light">
                {t.cbt.noEntries}
              </p>
            )}
            {entries.map((entry: CbtEntry) => {
              const d = entry.data as ThoughtDiaryData;
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-text-light">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setDeleteEntryId(entry.id)}
                      className="text-danger/60 hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p>
                      <span className="font-bold text-blue-500">
                        {t.cbt.situation}:
                      </span>{" "}
                      {d.situation}
                    </p>
                    <p>
                      <span className="font-bold text-purple-500">
                        {t.cbt.thought}:
                      </span>{" "}
                      {d.thought}
                    </p>
                    <p>
                      <span className="font-bold text-amber-500">
                        {t.cbt.emotion}:
                      </span>{" "}
                      {d.emotion}
                      {d.emotionIntensity ? ` (${d.emotionIntensity}/10)` : ""}
                    </p>
                    {d.distortion && (
                      <p>
                        <span className="font-bold text-rose-500">
                          {t.cbt.distortion}:
                        </span>{" "}
                        {d.distortion}
                      </p>
                    )}
                    {d.alternative && (
                      <p>
                        <span className="font-bold text-green-500">
                          {t.cbt.alternative}:
                        </span>{" "}
                        {d.alternative}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ConfirmDialog
          open={deleteEntryId !== null}
          onConfirm={() => {
            if (deleteEntryId) deleteMutation.mutate(deleteEntryId);
            setDeleteEntryId(null);
          }}
          onCancel={() => setDeleteEntryId(null)}
        />
      </AppLayout>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              step > 0 ? setStep(step - 1) : navigate("/exercises")
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-lg font-bold text-text-main">
            {t.cbt.thoughtDiary}
          </h1>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
        >
          <BookOpen size={18} className="text-text-light" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2.5 rounded-full transition-all ${
              i === step
                ? "w-8 bg-primary"
                : i < step
                  ? "w-2.5 bg-secondary"
                  : "w-2.5 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step label */}
      <div className="mt-3 text-center">
        <span className="text-xs font-bold text-text-light">
          {t.cbt.step} {step + 1} / {steps.length}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center px-5 pt-6">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${STEP_COLORS[step]}`}
        >
          <span className="text-lg font-bold text-white">{step + 1}</span>
        </div>

        <h2 className="mt-4 text-center text-lg font-extrabold text-text-main">
          {currentStep.label}
        </h2>

        {/* Distortion chips */}
        {currentStep.isDistortion ? (
          <div className="mt-5 w-full max-w-sm">
            <div className="flex flex-wrap justify-center gap-2">
              {DISTORTION_KEYS.map((key) => {
                const label =
                  t.cbt.distortions[key as keyof typeof t.cbt.distortions];
                const selected = distortion === label;
                return (
                  <button
                    key={key}
                    onClick={() => setDistortion(selected ? "" : label)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selected
                        ? "bg-rose-500 text-white"
                        : "bg-surface text-text-main shadow-sm"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <textarea
            value={currentStep.value}
            onChange={(e) => currentStep.set(e.target.value)}
            placeholder={currentStep.placeholder}
            rows={4}
            className="mt-5 w-full max-w-sm resize-none rounded-2xl border-0 bg-surface p-4 text-sm text-text-main shadow-sm placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}

        {/* Emotion intensity slider */}
        {currentStep.hasIntensity && (
          <div className="mt-4 w-full max-w-sm">
            <div className="flex items-center justify-between text-xs text-text-light">
              <span>{t.cbt.emotionIntensity}</span>
              <span className="font-bold text-amber-500">
                {emotionIntensity}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={emotionIntensity}
              onChange={(e) => setEmotionIntensity(Number(e.target.value))}
              className="mt-2 w-full accent-amber-500"
            />
          </div>
        )}
      </div>

      {/* Next button */}
      <div className="flex justify-center pb-12 pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed || createMutation.isPending}
          className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-lg transition-all ${
            canProceed
              ? "bg-gradient-to-r from-primary to-primary-dark text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {createMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : step < steps.length - 1 ? (
            <>
              {t.common.next} <ArrowRight size={18} />
            </>
          ) : (
            <>
              {t.common.save} <Check size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
