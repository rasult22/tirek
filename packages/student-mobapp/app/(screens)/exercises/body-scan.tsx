import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../components/ui";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { exercisesApi } from "../../../lib/api/exercises";
import { useThemeColors, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";

type Phase = "idle" | "focus" | "transition" | "complete";

const PHASE_COLORS: Record<Phase, string> = {
  idle: "#CBD5E1",
  focus: "#6C5CE7",
  transition: "#00B894",
  complete: "#00B894",
};

export default function BodyScanScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const { slug, exerciseId } = useLocalSearchParams<{
    slug: string;
    exerciseId: string;
  }>();

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesApi.list,
  });

  const exercise = exercises?.find(
    (e: any) => e.slug === slug || e.id === exerciseId,
  );
  const config = exercise?.config as
    | { steps: { nameRu: string; nameKz: string; durationSec: number }[] }
    | undefined;
  const steps = config?.steps ?? [];

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pausedProgressRef = useRef(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(slug!),
  });

  const startPulse = useCallback(() => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseRef.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseRef.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startStep = useCallback(
    (idx: number) => {
      if (idx >= steps.length) {
        setPhase("complete");
        setIsRunning(false);
        setProgress(1);
        stopPulse();
        completeMutation.mutate();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      setStepIndex(idx);
      setPhase("focus");
      setProgress(0);
      pausedProgressRef.current = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const durationMs = steps[idx].durationSec * 1000;
      startTimeRef.current = Date.now();

      clearTimer();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / durationMs, 1);
        setProgress(pct);

        if (pct >= 1) {
          clearTimer();
          // Brief transition
          setPhase("transition");
          setTimeout(() => startStep(idx + 1), 600);
        }
      }, 50);
    },
    [steps, stopPulse],
  );

  const handleStart = () => {
    setIsRunning(true);
    startPulse();
    startStep(0);
  };

  const handlePauseResume = () => {
    if (phase === "complete") return;
    if (isRunning) {
      clearTimer();
      stopPulse();
      pausedProgressRef.current = progress;
      setIsRunning(false);
    } else {
      setIsRunning(true);
      startPulse();
      const durationMs = steps[stepIndex].durationSec * 1000;
      startTimeRef.current =
        Date.now() - pausedProgressRef.current * durationMs;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / durationMs, 1);
        setProgress(pct);

        if (pct >= 1) {
          clearTimer();
          setPhase("transition");
          setTimeout(() => startStep(stepIndex + 1), 600);
        }
      }, 50);
    }
  };

  const handleReset = () => {
    clearTimer();
    stopPulse();
    setPhase("idle");
    setStepIndex(0);
    setProgress(0);
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopPulse();
    };
  }, [stopPulse]);

  if (!config || steps.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: c.textLight }]}>
            {t.common.error}
          </Text>
        </View>
      </View>
    );
  }

  const currentStep = steps[stepIndex];
  const stepName =
    language === "kz" ? currentStep?.nameKz : currentStep?.nameRu;
  const phaseColor = PHASE_COLORS[phase];
  const timeLeft =
    phase === "focus"
      ? Math.ceil(currentStep.durationSec * (1 - progress))
      : 0;

  const overallProgress =
    phase === "complete"
      ? 1
      : (stepIndex + progress) / steps.length;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: t.exercises.bodyScan }} />

      {/* Progress section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.stepText, { color: c.textLight }]}>
            {stepIndex + 1} / {steps.length}
          </Text>
          {phase === "focus" && (
            <Text style={[styles.timeText, { color: phaseColor }]}>
              {timeLeft}{t.exercises.sec}
            </Text>
          )}
        </View>
        <View
          style={[styles.progressTrack, { backgroundColor: c.surfaceSecondary }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${overallProgress * 100}%`,
                backgroundColor: c.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Circle area */}
      <View style={styles.circleArea}>
        <View style={styles.circleContainer}>
          <Animated.View
            style={[
              styles.circleOuter,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: phaseColor + "40",
                backgroundColor: phaseColor + "08",
              },
            ]}
          />
          <Animated.View
            style={[
              styles.circleMain,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: phaseColor + "20",
              },
            ]}
          />
          <View style={styles.circleLabelWrap}>
            {phase === "idle" && (
              <Text style={[styles.phaseLabel, { color: c.textLight }]}>
                {t.exercises.bodyScanIntro}
              </Text>
            )}
            {phase === "focus" && (
              <>
                <Text style={[styles.focusLabel, { color: c.textLight }]}>
                  {t.exercises.bodyScanFocus}
                </Text>
                <Text style={[styles.bodyPartName, { color: phaseColor }]}>
                  {stepName}
                </Text>
                <Text style={[styles.timerText, { color: c.text }]}>
                  {timeLeft}
                </Text>
              </>
            )}
            {phase === "transition" && (
              <Ionicons name="checkmark-circle" size={40} color="#00B894" />
            )}
            {phase === "complete" && (
              <>
                <Ionicons name="checkmark-circle" size={48} color={c.success} />
                <Text
                  style={[styles.completeText, { color: c.text }]}
                >
                  {t.exercises.complete}
                </Text>
              </>
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

        {(phase === "focus" || phase === "transition") && (
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
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 14 },

  progressSection: { paddingHorizontal: 32, marginTop: 16 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepText: { fontSize: 12, fontWeight: "700" },
  timeText: { fontSize: 12, fontWeight: "700" },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },

  circleArea: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  circleLabelWrap: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  focusLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  bodyPartName: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  timerText: {
    fontSize: 32,
    fontWeight: "800",
    opacity: 0.7,
    marginTop: 4,
  },
  completeText: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },

  controls: { alignItems: "center", paddingBottom: 48, paddingTop: 16 },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 20 },
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
  doneBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
