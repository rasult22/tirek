import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../components/ui";
import { useT } from "../../../lib/hooks/useLanguage";
import { exercisesApi } from "../../../lib/api/exercises";
import { exerciseConfigs } from "@tirek/shared";
import { useThemeColors, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";

type Phase = "inhale" | "hold1" | "exhale" | "hold2" | "idle" | "complete";

const PHASE_COLORS: Record<Phase, string> = {
  inhale: "#6C5CE7",
  hold1: "#F59E0B",
  exhale: "#00B894",
  hold2: "#F59E0B",
  idle: "#CBD5E1",
  complete: "#00B894",
};

export default function BreathingScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const config = exerciseConfigs[slug ?? ""];
  const totalCycles = config?.cycles ?? 4;

  const [phase, setPhase] = useState<Phase>("idle");
  const [cycle, setCycle] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const phaseDurationRef = useRef(0);
  const pausedProgressRef = useRef(0);
  const phaseIndexRef = useRef(0);
  const cycleRef = useRef(1);

  // Animated scale for breathing circle
  const scaleAnim = useRef(new Animated.Value(0.55)).current;

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(slug!),
  });

  const exerciseNames: Record<string, string> = {
    "square-breathing": t.exercises.squareBreathing,
    "breathing-478": t.exercises.breathing478,
    diaphragmatic: t.exercises.diaphragmatic,
  };

  const phaseLabels: Record<Phase, string> = {
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

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const animateScale = (toValue: number, duration: number) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const startPhase = useCallback(
    (phaseIdx: number, currentCycle: number) => {
      if (phaseIdx >= phaseSeq.length) {
        if (currentCycle >= totalCycles) {
          setPhase("complete");
          setIsRunning(false);
          setProgress(1);
          completeMutation.mutate();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        }
        cycleRef.current = currentCycle + 1;
        setCycle(currentCycle + 1);
        startPhase(0, currentCycle + 1);
        return;
      }

      const { phase: p, duration } = phaseSeq[phaseIdx];
      setPhase(p);
      phaseDurationRef.current = duration * 1000;
      startTimeRef.current = Date.now();
      phaseIndexRef.current = phaseIdx;
      pausedProgressRef.current = 0;

      // Haptic on phase transition
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Animate circle scale
      if (p === "inhale") animateScale(1.0, duration * 1000);
      else if (p === "exhale") animateScale(0.55, duration * 1000);
      // hold phases keep current scale

      clearTimer();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);

        if (pct >= 1) {
          clearTimer();
          startPhase(phaseIdx + 1, cycleRef.current);
        }
      }, 30);
    },
    [phaseSeq, totalCycles],
  );

  const handleStart = () => {
    setCycle(1);
    cycleRef.current = 1;
    setIsRunning(true);
    phaseIndexRef.current = 0;
    animateScale(0.55, 0);
    startPhase(0, 1);
  };

  const handlePauseResume = () => {
    if (phase === "complete") return;
    if (isRunning) {
      clearTimer();
      scaleAnim.stopAnimation();
      pausedProgressRef.current = progress;
      setIsRunning(false);
    } else {
      setIsRunning(true);
      const remaining = (1 - pausedProgressRef.current) * phaseDurationRef.current;
      startTimeRef.current = Date.now() - pausedProgressRef.current * phaseDurationRef.current;

      // Resume scale animation
      const currentPhase = phaseSeq[phaseIndexRef.current]?.phase;
      if (currentPhase === "inhale") animateScale(1.0, remaining);
      else if (currentPhase === "exhale") animateScale(0.55, remaining);

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);

        if (pct >= 1) {
          clearTimer();
          startPhase(phaseIndexRef.current + 1, cycleRef.current);
        }
      }, 30);
    }
  };

  const handleReset = () => {
    clearTimer();
    setPhase("idle");
    setCycle(1);
    cycleRef.current = 1;
    setProgress(0);
    setIsRunning(false);
    animateScale(0.55, 300);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  if (!config) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: c.textLight }]}>{t.common.error}</Text>
        </View>
      </View>
    );
  }

  const phaseColor = PHASE_COLORS[phase];

  // Time left display
  const timeLeft =
    phase !== "idle" && phase !== "complete"
      ? Math.ceil((phaseDurationRef.current / 1000) * (1 - progress))
      : 0;

  // Overall progress
  const totalPhases = phaseSeq.length * totalCycles;
  const completedPhases = phaseSeq.length * (cycle - 1) + phaseIndexRef.current;
  const overallProgress =
    phase === "complete" ? 1 : (completedPhases + progress) / totalPhases;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen
        options={{ title: exerciseNames[slug ?? ""] ?? "" }}
      />

      {/* Cycle counter + progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.cycleText, { color: c.textLight }]}>
            {t.exercises.cycle} {cycle} {t.exercises.of} {totalCycles}
          </Text>
          {phase !== "idle" && phase !== "complete" && (
            <Text style={[styles.timeText, { color: phaseColor }]}>
              {timeLeft}{t.exercises.sec}
            </Text>
          )}
        </View>
        <View style={[styles.progressTrack, { backgroundColor: c.surfaceSecondary }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${overallProgress * 100}%`, backgroundColor: c.primary },
            ]}
          />
        </View>
      </View>

      {/* Breathing circle area */}
      <View style={styles.circleArea}>
        <View style={styles.circleContainer}>
          {/* Outer glow */}
          <Animated.View
            style={[
              styles.circleOuter,
              {
                transform: [{ scale: scaleAnim }],
                borderColor: phaseColor + "40",
                backgroundColor: phaseColor + "08",
              },
            ]}
          />
          {/* Main circle */}
          <Animated.View
            style={[
              styles.circleMain,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: phaseColor + "25",
              },
            ]}
          />
          {/* Inner circle */}
          <Animated.View
            style={[
              styles.circleInner,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: phaseColor + "15",
              },
            ]}
          />
          {/* Center label */}
          <View style={styles.circleLabelWrap}>
            <Text style={[styles.phaseLabel, { color: phaseColor }]}>
              {phaseLabels[phase]}
            </Text>
            {phase !== "idle" && phase !== "complete" && timeLeft > 0 && (
              <Text style={[styles.timerText, { color: c.text }]}>{timeLeft}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {phase === "idle" && (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.playBtn,
              { backgroundColor: c.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
            ]}
          >
            <Ionicons name="play" size={28} color="#FFFFFF" />
          </Pressable>
        )}

        {phase !== "idle" && phase !== "complete" && (
          <View style={styles.controlsRow}>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [
                styles.resetBtn,
                { backgroundColor: c.surface },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="refresh" size={20} color={c.textLight} />
            </Pressable>
            <Pressable
              onPress={handlePauseResume}
              style={({ pressed }) => [
                styles.playBtn,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Ionicons
                name={isRunning ? "pause" : "play"}
                size={28}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        )}

        {phase === "complete" && (
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: c.success },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.doneBtnText}>{t.common.retry}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
  },

  // Progress
  progressSection: {
    paddingHorizontal: 32,
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cycleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },

  // Circle
  circleArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleContainer: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  circleOuter: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
  },
  circleMain: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  circleInner: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  circleLabelWrap: {
    alignItems: "center",
  },
  phaseLabel: {
    fontSize: 20,
    fontWeight: "800",
  },
  timerText: {
    fontSize: 32,
    fontWeight: "800",
    opacity: 0.7,
    marginTop: 4,
  },

  // Controls
  controls: {
    alignItems: "center",
    paddingBottom: 48,
    paddingTop: 16,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(3),
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingHorizontal: 32,
    paddingVertical: 14,
    ...shadow(2),
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
