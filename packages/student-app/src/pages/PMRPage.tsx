import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Play, Pause, RotateCcw, Check } from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { exercisesApi } from "../api/exercises.js";
import type { Exercise, PMRConfig } from "@tirek/shared";

type Phase = "idle" | "tension" | "hold" | "release" | "rest" | "complete";

const PHASE_COLORS: Record<Phase, string> = {
  idle: "from-gray-200 to-gray-300",
  tension: "from-red-400/70 to-red-500/70",
  hold: "from-amber-400/70 to-amber-500/70",
  release: "from-green-400/70 to-green-500/70",
  rest: "from-blue-300/50 to-blue-400/50",
  complete: "from-secondary/50 to-secondary/70",
};

const REST_SECONDS = 3;

export function PMRPage({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const config = exercise.config as PMRConfig;
  const steps = config.steps;

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const phaseDurationRef = useRef(0);

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(exercise.slug),
  });

  const step = steps[stepIdx];
  const muscleName = language === "kz" ? step?.muscleGroupKz : step?.muscleGroupRu;
  const name = language === "kz" && exercise.nameKz ? exercise.nameKz : exercise.nameRu;

  const phaseLabels: Record<Phase, string> = {
    idle: t.exercises.start,
    tension: t.exercises.pmrTension,
    hold: t.exercises.pmrHold,
    release: t.exercises.pmrRelease,
    rest: t.exercises.pmrRest,
    complete: t.exercises.complete,
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startPhase = useCallback(
    (newPhase: Phase, durationSec: number, currentStepIdx: number) => {
      setPhase(newPhase);
      phaseDurationRef.current = durationSec * 1000;
      startTimeRef.current = Date.now();

      clearTimer();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);

        if (pct >= 1) {
          clearTimer();
          // Advance to next phase
          if (newPhase === "tension") {
            startPhase("hold", steps[currentStepIdx].holdSec, currentStepIdx);
          } else if (newPhase === "hold") {
            startPhase("release", steps[currentStepIdx].releaseSec, currentStepIdx);
          } else if (newPhase === "release") {
            if (currentStepIdx < steps.length - 1) {
              startPhase("rest", REST_SECONDS, currentStepIdx);
            } else {
              setPhase("complete");
              setIsRunning(false);
              setProgress(1);
              completeMutation.mutate();
            }
          } else if (newPhase === "rest") {
            const nextIdx = currentStepIdx + 1;
            setStepIdx(nextIdx);
            startPhase("tension", steps[nextIdx].tensionSec, nextIdx);
          }
        }
      }, 30);
    },
    [steps],
  );

  const handleStart = () => {
    setStepIdx(0);
    setIsRunning(true);
    startPhase("tension", steps[0].tensionSec, 0);
  };

  const handlePauseResume = () => {
    if (phase === "complete") return;
    if (isRunning) {
      clearTimer();
      setIsRunning(false);
    } else {
      setIsRunning(true);
      startTimeRef.current = Date.now() - progress * phaseDurationRef.current;
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);
        if (pct >= 1) {
          clearTimer();
          // Re-trigger same advancement logic
          if (phase === "tension") {
            startPhase("hold", steps[stepIdx].holdSec, stepIdx);
          } else if (phase === "hold") {
            startPhase("release", steps[stepIdx].releaseSec, stepIdx);
          } else if (phase === "release") {
            if (stepIdx < steps.length - 1) {
              startPhase("rest", REST_SECONDS, stepIdx);
            } else {
              setPhase("complete");
              setIsRunning(false);
              setProgress(1);
              completeMutation.mutate();
            }
          } else if (phase === "rest") {
            const nextIdx = stepIdx + 1;
            setStepIdx(nextIdx);
            startPhase("tension", steps[nextIdx].tensionSec, nextIdx);
          }
        }
      }, 30);
    }
  };

  const handleReset = () => {
    clearTimer();
    setPhase("idle");
    setStepIdx(0);
    setProgress(0);
    setIsRunning(false);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  // Circle visual
  const circleScale =
    phase === "tension"
      ? 0.6 + 0.4 * progress
      : phase === "release"
        ? 1.0 - 0.3 * progress
        : phase === "hold"
          ? 1.0
          : phase === "rest"
            ? 0.7
            : phase === "complete"
              ? 0.8
              : 0.6;

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

      {/* Step counter */}
      <div className="mt-4 text-center">
        <span className="text-xs font-bold text-text-light">
          {t.exercises.pmrStep} {stepIdx + 1} {t.exercises.of} {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-8 mt-3 h-1.5 rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${((stepIdx + (phase !== "idle" ? progress * 0.25 : 0)) / steps.length) * 100}%` }}
        />
      </div>

      {/* Muscle group name */}
      {phase !== "idle" && phase !== "complete" && (
        <div className="mt-4 text-center">
          <span className="text-sm font-bold text-primary-dark">{muscleName}</span>
        </div>
      )}

      {/* Animated circle */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${PHASE_COLORS[phase]} transition-all duration-100 ease-linear`}
            style={{ transform: `scale(${circleScale})`, opacity: 0.8 }}
          />
          <div
            className={`absolute inset-4 rounded-full bg-gradient-to-br ${PHASE_COLORS[phase]} transition-all duration-100 ease-linear`}
            style={{ transform: `scale(${circleScale})`, opacity: 0.5 }}
          />
          <div className="relative z-10 text-center">
            <span className="block text-lg font-extrabold text-text-main">
              {phaseLabels[phase]}
            </span>
            {phase !== "idle" && phase !== "complete" && (
              <span className="mt-1 block text-xs text-text-light">
                {muscleName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-12 pt-4">
        {phase === "idle" && (
          <button
            onClick={handleStart}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
          >
            <Play size={28} fill="white" />
          </button>
        )}

        {phase !== "idle" && phase !== "complete" && (
          <>
            <button
              onClick={handleReset}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <RotateCcw size={20} className="text-text-light" />
            </button>
            <button
              onClick={handlePauseResume}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
            >
              {isRunning ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </button>
          </>
        )}

        {phase === "complete" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
              <Check size={32} className="text-secondary" />
            </div>
            <button
              onClick={() => navigate("/exercises")}
              className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-3.5 text-sm font-bold text-white shadow-lg"
            >
              {t.common.done}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
