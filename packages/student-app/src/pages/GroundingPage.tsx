import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Eye, Ear, Hand, Flower2, Apple, Check } from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { exercisesApi } from "../api/exercises.js";
import type { Exercise, GroundingConfig } from "@tirek/shared";

const SENSE_ICONS = {
  eye: Eye,
  ear: Ear,
  hand: Hand,
  flower: Flower2,
  apple: Apple,
};

const STEP_COLORS = [
  "from-blue-400/80 to-blue-500/80",
  "from-purple-400/80 to-purple-500/80",
  "from-amber-400/80 to-amber-500/80",
  "from-green-400/80 to-green-500/80",
  "from-rose-400/80 to-rose-500/80",
];

export function GroundingPage({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const config = exercise.config as GroundingConfig;
  const steps = config.steps;

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(exercise.slug),
  });

  const step = steps[currentStep];
  const Icon = SENSE_ICONS[step?.icon as keyof typeof SENSE_ICONS] ?? Eye;
  const senseName = language === "kz" ? step?.senseKz : step?.senseRu;

  const handleStartStep = () => {
    setCheckedItems(new Array(step.count).fill(false));
  };

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const allChecked = checkedItems.length > 0 && checkedItems.every(Boolean);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setCheckedItems([]);
    } else {
      setCompleted(true);
      completeMutation.mutate();
    }
  };

  // Initialize checked items on first render of a step
  if (checkedItems.length === 0 && step && !completed) {
    handleStartStep();
  }

  const name = language === "kz" && exercise.nameKz ? exercise.nameKz : exercise.nameRu;

  if (completed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/20">
          <Check size={48} className="text-secondary" />
        </div>
        <h2 className="mt-6 text-xl font-extrabold text-text-main">
          {t.exercises.groundingDone}
        </h2>
        <p className="mt-2 text-sm text-text-light">{t.exercises.complete}</p>
        <button
          onClick={() => navigate("/exercises")}
          className="mt-8 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-3.5 text-sm font-bold text-white shadow-lg"
        >
          {t.common.done}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={() => navigate("/exercises")}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
        >
          <ArrowLeft size={20} className="text-text-main" />
        </button>
        <h1 className="text-lg font-bold text-text-main">{name}</h1>
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2.5 rounded-full transition-all ${
              i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-2.5 bg-secondary" : "w-2.5 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step info */}
      <div className="mt-3 text-center">
        <span className="text-xs font-bold text-text-light">
          {t.exercises.groundingStep} {currentStep + 1} {t.exercises.of} {steps.length}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center px-5 pt-8">
        {/* Sense icon */}
        <div className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${STEP_COLORS[currentStep]}`}>
          <Icon size={40} className="text-white" strokeWidth={1.5} />
        </div>

        {/* Instruction */}
        <h2 className="mt-5 text-center text-lg font-extrabold text-text-main">
          {t.exercises.groundingNameItem} {step.count} {senseName}
        </h2>

        {/* Checkboxes */}
        <div className="mt-6 w-full max-w-xs space-y-3">
          {checkedItems.map((checked, idx) => (
            <button
              key={idx}
              onClick={() => toggleItem(idx)}
              className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 transition-all ${
                checked
                  ? "bg-secondary/15 shadow-sm"
                  : "bg-white shadow-sm"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  checked
                    ? "bg-secondary text-white"
                    : "border-2 border-gray-200"
                }`}
              >
                {checked && <Check size={16} />}
              </div>
              <span className={`text-sm font-medium ${checked ? "text-secondary" : "text-text-light"}`}>
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-center pb-12 pt-4">
        <button
          onClick={handleNext}
          disabled={!allChecked}
          className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-lg transition-all ${
            allChecked
              ? "bg-gradient-to-r from-primary to-primary-dark text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {currentStep < steps.length - 1 ? t.common.next : t.common.done}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
