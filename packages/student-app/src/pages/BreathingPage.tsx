import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { exercisesApi } from "../api/exercises.js";
import { exerciseConfigs } from "@tirek/shared";

type Phase = "inhale" | "hold1" | "exhale" | "hold2" | "idle" | "complete";

// SVG arc progress helper
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const PHASE_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  inhale: { ring: "#6C5CE7", bg: "from-primary/50 to-primary-dark/50", text: "text-primary-dark" },
  hold1: { ring: "#F59E0B", bg: "from-accent/40 to-accent/60", text: "text-accent" },
  exhale: { ring: "#00B894", bg: "from-secondary/50 to-secondary/70", text: "text-secondary" },
  hold2: { ring: "#F59E0B", bg: "from-accent/40 to-accent/60", text: "text-accent" },
  idle: { ring: "#CBD5E1", bg: "from-gray-200 to-gray-300", text: "text-text-light" },
  complete: { ring: "#00B894", bg: "from-secondary/40 to-secondary/60", text: "text-secondary" },
};

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
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const phaseDurationRef = useRef(0);
  const pausedProgressRef = useRef(0);

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
      startTimeRef.current = performance.now();
      phaseIndexRef.current = phaseIdx;
      pausedProgressRef.current = 0;

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const tick = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);
        if (pct >= 1) {
          startPhase(phaseIdx + 1, currentCycle);
        } else {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      pausedProgressRef.current = progress;
      setIsRunning(false);
    } else {
      setIsRunning(true);
      const remaining = (1 - pausedProgressRef.current) * phaseDurationRef.current;
      const adjustedDuration = remaining;
      const resumeStart = performance.now();

      const tick = () => {
        const elapsed = performance.now() - resumeStart;
        const pct = pausedProgressRef.current + (elapsed / adjustedDuration) * (1 - pausedProgressRef.current);
        const clampedPct = Math.min(pct, 1);
        setProgress(clampedPct);
        if (clampedPct >= 1) {
          startPhase(phaseIndexRef.current + 1, cycle);
        } else {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const handleReset = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setPhase("idle");
    setCycle(1);
    setProgress(0);
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <ErrorState onRetry={() => navigate("/exercises")} />
      </div>
    );
  }

  // Circle scaling synced to breath phases
  const circleScale =
    phase === "inhale"
      ? 0.55 + 0.45 * progress
      : phase === "exhale"
        ? 1.0 - 0.45 * progress
        : phase === "hold1"
          ? 1.0
          : phase === "hold2"
            ? 0.55
            : 0.55;

  const colors = PHASE_COLORS[phase] ?? PHASE_COLORS.idle;
  const arcAngle = progress * 360;

  // Phase duration for display (countdown)
  const currentPhaseDuration = phaseDurationRef.current / 1000;
  const timeLeft = phase !== "idle" && phase !== "complete"
    ? Math.ceil(currentPhaseDuration * (1 - progress))
    : 0;

  // Total progress across all cycles
  const totalPhases = phaseSeq.length * totalCycles;
  const completedPhases = phaseSeq.length * (cycle - 1) + phaseIndexRef.current;
  const overallProgress = phase === "complete" ? 1 : (completedPhases + progress) / totalPhases;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={() => navigate("/exercises")}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
        >
          <ArrowLeft size={20} className="text-text-main" />
        </button>
        <h1 className="text-lg font-bold text-text-main">{exerciseNames[id ?? ""]}</h1>
      </div>

      {/* Cycle counter + overall progress bar */}
      <div className="mt-4 px-8">
        <div className="flex items-center justify-between text-xs font-bold text-text-light">
          <span>
            {t.exercises.cycle} {cycle} {t.exercises.of} {totalCycles}
          </span>
          {phase !== "idle" && phase !== "complete" && (
            <span className={colors.text}>{timeLeft}{t.exercises.sec}</span>
          )}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-linear"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Breathing circle */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative flex h-72 w-72 items-center justify-center">
          {/* SVG progress arc ring */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 288 288"
            style={{ transform: "rotate(0deg)" }}
          >
            {/* Background track */}
            <circle
              cx="144"
              cy="144"
              r="138"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-200/60"
            />
            {/* Progress arc */}
            {phase !== "idle" && phase !== "complete" && arcAngle > 0.5 && (
              <path
                d={describeArc(144, 144, 138, 0, Math.min(arcAngle, 359.5))}
                fill="none"
                stroke={colors.ring}
                strokeWidth="4"
                strokeLinecap="round"
                className="drop-shadow-sm"
                style={{
                  filter: `drop-shadow(0 0 6px ${colors.ring}40)`,
                }}
              />
            )}
            {/* Dot at progress tip */}
            {phase !== "idle" && phase !== "complete" && (
              <circle
                cx={polarToCartesian(144, 144, 138, arcAngle).x}
                cy={polarToCartesian(144, 144, 138, arcAngle).y}
                r="6"
                fill={colors.ring}
                className="drop-shadow-md"
                style={{
                  filter: `drop-shadow(0 0 8px ${colors.ring}80)`,
                }}
              />
            )}
          </svg>

          {/* Outer glow ring — pulses at phase transitions */}
          <div
            className={`absolute inset-2 rounded-full transition-all ${
              phase === "inhale" || phase === "exhale"
                ? "ring-4 ring-offset-2"
                : "ring-2 ring-offset-1"
            }`}
            style={{
              transform: `scale(${circleScale})`,
              boxShadow: phase === "inhale"
                ? `0 0 30px ${colors.ring}30, inset 0 0 20px ${colors.ring}15`
                : phase === "exhale"
                  ? `0 0 20px ${colors.ring}20, inset 0 0 15px ${colors.ring}10`
                  : `0 0 10px ${colors.ring}15`,
              transitionDuration: `${phaseDurationRef.current}ms`,
              transitionTimingFunction: "ease-in-out",
              borderColor: `${colors.ring}60`,
              borderWidth: phase === "inhale" || phase === "exhale" ? "3px" : "2px",
              borderStyle: "solid",
            }}
          />

          {/* Main breathing circle */}
          <div
            className={`absolute inset-6 rounded-full bg-gradient-to-br ${colors.bg}`}
            style={{
              transform: `scale(${circleScale})`,
              opacity: 0.85,
              transitionDuration: `${phaseDurationRef.current}ms`,
              transitionTimingFunction: "ease-in-out",
              transitionProperty: "transform, opacity",
              boxShadow: `0 0 40px ${colors.ring}25`,
            }}
          />

          {/* Inner circle (depth effect) */}
          <div
            className={`absolute inset-12 rounded-full bg-gradient-to-br ${colors.bg}`}
            style={{
              transform: `scale(${circleScale})`,
              opacity: 0.4,
              transitionDuration: `${phaseDurationRef.current}ms`,
              transitionTimingFunction: "ease-in-out",
              transitionProperty: "transform, opacity",
            }}
          />

          {/* Center label + timer */}
          <div className="relative z-10 flex flex-col items-center">
            <span className={`text-xl font-extrabold ${colors.text}`}>
              {phaseLabels[phase]}
            </span>
            {phase !== "idle" && phase !== "complete" && timeLeft > 0 && (
              <span className="mt-1 text-3xl font-black tabular-nums text-text-main/80">
                {timeLeft}
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
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            <Play size={28} fill="white" />
          </button>
        )}

        {phase !== "idle" && phase !== "complete" && (
          <>
            <button
              onClick={handleReset}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sm active:scale-95 transition-transform"
            >
              <RotateCcw size={20} className="text-text-light" />
            </button>
            <button
              onClick={handlePauseResume}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              {isRunning ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </button>
          </>
        )}

        {phase === "complete" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 px-8 py-3.5 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
          >
            <RotateCcw size={18} />
            {t.common.retry}
          </button>
        )}
      </div>
    </div>
  );
}
