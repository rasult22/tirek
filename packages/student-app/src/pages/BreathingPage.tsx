import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { exercisesApi } from "../api/exercises.js";
import { exerciseConfigs } from "@tirek/shared";

type Phase = "inhale" | "hold1" | "exhale" | "hold2" | "idle" | "complete";

export function BreathingPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const config = exerciseConfigs[id ?? ""];
  const totalCycles = config?.cycles ?? 4;

  const [phase, setPhase] = useState<Phase>("idle");
  const [cycle, setCycle] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const phaseDurationRef = useRef(0);

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(id!),
  });

  const exerciseNames: Record<string, string> = {
    "square-breathing": t.exercises.squareBreathing,
    "breathing-478": t.exercises.breathing478,
    diaphragmatic: t.exercises.diaphragmatic,
  };

  const phaseLabels: Record<string, string> = {
    inhale: t.exercises.inhale,
    hold1: t.exercises.hold,
    exhale: t.exercises.exhale,
    hold2: t.exercises.hold,
    idle: t.exercises.start,
    complete: t.exercises.complete,
  };

  const getPhaseSequence = useCallback(() => {
    if (!config) return [];
    const seq: { phase: Phase; duration: number }[] = [];
    seq.push({ phase: "inhale", duration: config.inhale });
    if (config.hold1) seq.push({ phase: "hold1", duration: config.hold1 });
    if (config.hold && !config.hold1) seq.push({ phase: "hold1", duration: config.hold });
    seq.push({ phase: "exhale", duration: config.exhale });
    if (config.hold2) seq.push({ phase: "hold2", duration: config.hold2 });
    return seq;
  }, [config]);

  const phaseSeq = getPhaseSequence();
  const phaseIndexRef = useRef(0);

  const startPhase = useCallback(
    (phaseIdx: number, currentCycle: number) => {
      if (phaseIdx >= phaseSeq.length) {
        if (currentCycle >= totalCycles) {
          setPhase("complete");
          setIsRunning(false);
          setProgress(1);
          completeMutation.mutate();
          return;
        }
        setCycle(currentCycle + 1);
        startPhase(0, currentCycle + 1);
        return;
      }

      const { phase: p, duration } = phaseSeq[phaseIdx];
      setPhase(p);
      phaseDurationRef.current = duration * 1000;
      startTimeRef.current = Date.now();
      phaseIndexRef.current = phaseIdx;

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);
        if (pct >= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          startPhase(phaseIdx + 1, currentCycle);
        }
      }, 30);
    },
    [phaseSeq, totalCycles],
  );

  const handleStart = () => {
    setCycle(1);
    setIsRunning(true);
    phaseIndexRef.current = 0;
    startPhase(0, 1);
  };

  const handlePauseResume = () => {
    if (phase === "complete") return;
    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
    } else {
      setIsRunning(true);
      startTimeRef.current = Date.now() - progress * phaseDurationRef.current;
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);
        if (pct >= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          startPhase(phaseIndexRef.current + 1, cycle);
        }
      }, 30);
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("idle");
    setCycle(1);
    setProgress(0);
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-light">{t.common.error}</p>
      </div>
    );
  }

  // Circle size based on phase
  const circleScale =
    phase === "inhale"
      ? 0.6 + 0.4 * progress
      : phase === "exhale"
        ? 1.0 - 0.4 * progress
        : phase === "hold1" || phase === "hold2"
          ? phase === "hold1" ? 1.0 : 0.6
          : 0.6;

  const circleColor =
    phase === "inhale"
      ? "from-primary/60 to-primary-dark/60"
      : phase === "exhale"
        ? "from-secondary/60 to-secondary/80"
        : phase === "hold1" || phase === "hold2"
          ? "from-accent/50 to-accent/70"
          : phase === "complete"
            ? "from-secondary/50 to-secondary/70"
            : "from-gray-200 to-gray-300";

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
        <h1 className="text-lg font-bold text-text-main">{exerciseNames[id ?? ""]}</h1>
      </div>

      {/* Cycle counter */}
      <div className="mt-4 text-center">
        <span className="text-xs font-bold text-text-light">
          {t.exercises.cycle} {cycle} {t.exercises.of} {totalCycles}
        </span>
      </div>

      {/* Breathing circle */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative flex h-64 w-64 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${circleColor} transition-all duration-100 ease-linear`}
            style={{ transform: `scale(${circleScale})`, opacity: 0.8 }}
          />
          <div
            className={`absolute inset-4 rounded-full bg-gradient-to-br ${circleColor} transition-all duration-100 ease-linear`}
            style={{ transform: `scale(${circleScale})`, opacity: 0.5 }}
          />
          <span className="relative z-10 text-lg font-extrabold text-text-main">
            {phaseLabels[phase]}
          </span>
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
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 px-8 py-3.5 text-sm font-bold text-white shadow-lg"
          >
            <RotateCcw size={18} />
            {t.common.retry}
          </button>
        )}
      </div>
    </div>
  );
}
