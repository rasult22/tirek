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
  Hand,
  Wind,
  Eye,
  ArrowRightCircle,
} from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { cbtApi } from "../api/cbt.js";
import type { Exercise, StopTechniqueData, CbtEntry } from "@tirek/shared";

const STEP_CONFIG = [
  { color: "from-red-400 to-red-500", iconColor: "text-red-500", Icon: Hand },
  { color: "from-blue-400 to-blue-500", iconColor: "text-blue-500", Icon: Wind },
  { color: "from-amber-400 to-amber-500", iconColor: "text-amber-500", Icon: Eye },
  {
    color: "from-green-400 to-green-500",
    iconColor: "text-green-500",
    Icon: ArrowRightCircle,
  },
];

export function StopTechniquePage({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [stop, setStop] = useState("");
  const [breathe, setBreathe] = useState("");
  const [observe, setObserve] = useState("");
  const [proceed, setProceed] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: history } = useQuery({
    queryKey: ["cbt", "list", "stop_technique"],
    queryFn: () => cbtApi.list("stop_technique"),
  });

  const createMutation = useMutation({
    mutationFn: cbtApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
      setCompleted(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: cbtApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
    },
  });

  const steps = [
    {
      label: t.cbt.stopStep,
      desc: t.cbt.stopStepDesc,
      placeholder: t.cbt.stopPlaceholder,
      value: stop,
      set: setStop,
    },
    {
      label: t.cbt.breatheStep,
      desc: t.cbt.breatheStepDesc,
      placeholder: t.cbt.breathePlaceholder,
      value: breathe,
      set: setBreathe,
    },
    {
      label: t.cbt.observeStep,
      desc: t.cbt.observeStepDesc,
      placeholder: t.cbt.observePlaceholder,
      value: observe,
      set: setObserve,
    },
    {
      label: t.cbt.proceedStep,
      desc: t.cbt.proceedStepDesc,
      placeholder: t.cbt.proceedPlaceholder,
      value: proceed,
      set: setProceed,
    },
  ];

  const currentStep = steps[step];
  const cfg = STEP_CONFIG[step];
  const canProceed = (currentStep?.value?.trim().length ?? 0) > 0;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      createMutation.mutate({
        type: "stop_technique",
        data: { stop, breathe, observe, proceed },
      });
    }
  };

  const handleReset = () => {
    setStep(0);
    setStop("");
    setBreathe("");
    setObserve("");
    setProceed("");
    setCompleted(false);
  };

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
              const d = entry.data as StopTechniqueData;
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
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="text-danger/60 hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p>
                      <span className="font-bold text-red-500">
                        {t.cbt.stopStep}:
                      </span>{" "}
                      {d.stop}
                    </p>
                    <p>
                      <span className="font-bold text-blue-500">
                        {t.cbt.breatheStep}:
                      </span>{" "}
                      {d.breathe}
                    </p>
                    <p>
                      <span className="font-bold text-amber-500">
                        {t.cbt.observeStep}:
                      </span>{" "}
                      {d.observe}
                    </p>
                    <p>
                      <span className="font-bold text-green-500">
                        {t.cbt.proceedStep}:
                      </span>{" "}
                      {d.proceed}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
            {t.cbt.stopTechnique}
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

      <div className="mt-3 text-center">
        <span className="text-xs font-bold text-text-light">
          {t.cbt.step} {step + 1} / {steps.length}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center px-5 pt-6">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${cfg.color}`}
        >
          <cfg.Icon size={32} className="text-white" strokeWidth={1.5} />
        </div>

        <h2 className="mt-4 text-center text-xl font-extrabold text-text-main">
          {currentStep.label}
        </h2>
        <p className="mt-2 max-w-xs text-center text-sm text-text-light">
          {currentStep.desc}
        </p>

        <textarea
          value={currentStep.value}
          onChange={(e) => currentStep.set(e.target.value)}
          placeholder={currentStep.placeholder}
          rows={4}
          className="mt-5 w-full max-w-sm resize-none rounded-2xl border-0 bg-surface p-4 text-sm text-text-main shadow-sm placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
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
