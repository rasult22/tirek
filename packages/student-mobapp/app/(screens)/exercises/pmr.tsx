import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../components/ui";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { exercisesApi } from "../../../lib/api/exercises";
import { useThemeColors, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import type { PMRConfig } from "@tirek/shared";

type Phase = "idle" | "tension" | "hold" | "release" | "rest" | "complete";

export default function PMRScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const { back } = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const PHASE_COLORS: Record<Phase, string> = {
    idle: c.textLight,
    tension: "#EF4444",
    hold: "#F59E0B",
    release: "#22C55E",
    rest: "#3B82F6",
    complete: c.success,
  };

  const REST_SECONDS = 3;

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesApi.list,
  });

  const exercise = exercises?.find((e) => e.slug === slug);
  const config = exercise?.config as PMRConfig | undefined;
  const steps = config?.steps ?? [];
  const name = exercise
    ? language === "kz" && exercise.nameKz
      ? exercise.nameKz
      : exercise.nameRu
    : "";

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const phaseDurationRef = useRef(0);
  const stepIdxRef = useRef(0);

  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(slug!),
  });

  const step = steps[stepIdx];
  const muscleName = step
    ? language === "kz"
      ? step.muscleGroupKz
      : step.muscleGroupRu
    : "";

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

  const animateScale = (toValue: number, duration: number) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const startPhase = useCallback(
    (newPhase: Phase, durationSec: number, currentStepIdx: number) => {
      setPhase(newPhase);
      phaseDurationRef.current = durationSec * 1000;
      startTimeRef.current = Date.now();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Animate circle
      if (newPhase === "tension") animateScale(1.0, durationSec * 1000);
      else if (newPhase === "release") animateScale(0.6, durationSec * 1000);
      else if (newPhase === "hold") animateScale(1.0, 0);
      else if (newPhase === "rest") animateScale(0.7, 300);

      clearTimer();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / phaseDurationRef.current, 1);
        setProgress(pct);

        if (pct >= 1) {
          clearTimer();
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          } else if (newPhase === "rest") {
            const nextIdx = currentStepIdx + 1;
            stepIdxRef.current = nextIdx;
            setStepIdx(nextIdx);
            startPhase("tension", steps[nextIdx].tensionSec, nextIdx);
          }
        }
      }, 30);
    },
    [steps],
  );

  const handleStart = () => {
    if (steps.length === 0) return;
    setStepIdx(0);
    stepIdxRef.current = 0;
    setIsRunning(true);
    animateScale(0.6, 0);
    startPhase("tension", steps[0].tensionSec, 0);
  };

  const handlePauseResume = () => {
    if (phase === "complete") return;
    if (isRunning) {
      clearTimer();
      scaleAnim.stopAnimation();
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
          const idx = stepIdxRef.current;
          if (phase === "tension") {
            startPhase("hold", steps[idx].holdSec, idx);
          } else if (phase === "hold") {
            startPhase("release", steps[idx].releaseSec, idx);
          } else if (phase === "release") {
            if (idx < steps.length - 1) {
              startPhase("rest", REST_SECONDS, idx);
            } else {
              setPhase("complete");
              setIsRunning(false);
              setProgress(1);
              completeMutation.mutate();
            }
          } else if (phase === "rest") {
            const nextIdx = idx + 1;
            stepIdxRef.current = nextIdx;
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
    stepIdxRef.current = 0;
    setProgress(0);
    setIsRunning(false);
    animateScale(0.6, 300);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const phaseColor = PHASE_COLORS[phase];
  const overallProgress =
    phase === "complete"
      ? 1
      : steps.length > 0
        ? (stepIdx + (phase !== "idle" ? progress * 0.25 : 0)) / steps.length
        : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: name }} />

      {/* Step counter */}
      <View style={styles.header}>
        <Text style={[styles.stepText, { color: c.textLight }]}>
          {t.exercises.pmrStep} {stepIdx + 1} {t.exercises.of} {steps.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: c.surfaceSecondary }]}>
        <View
          style={[styles.progressFill, { width: `${overallProgress * 100}%`, backgroundColor: c.primary }]}
        />
      </View>

      {/* Muscle name */}
      {phase !== "idle" && phase !== "complete" && (
        <Text style={[styles.muscleName, { color: c.primaryDark }]}>{muscleName}</Text>
      )}

      {/* Animated circle */}
      <View style={styles.circleArea}>
        <View style={styles.circleContainer}>
          <Animated.View
            style={[
              styles.circleOuter,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: phaseColor + "30",
              },
            ]}
          />
          <Animated.View
            style={[
              styles.circleInner,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: phaseColor + "18",
              },
            ]}
          />
          <View style={styles.circleLabelWrap}>
            <Text style={[styles.phaseLabel, { color: phaseColor }]}>
              {phaseLabels[phase]}
            </Text>
            {phase !== "idle" && phase !== "complete" && (
              <Text style={[styles.muscleSubtext, { color: c.textLight }]}>{muscleName}</Text>
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
          <View style={styles.completeWrap}>
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark" size={32} color={c.success} />
            </View>
            <Pressable
              onPress={() => back()}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.doneBtnText}>{t.common.done}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    alignItems: "center",
    marginTop: 16,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "700",
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 32,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },

  muscleName: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 16,
  },

  // Circle
  circleArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleContainer: {
    width: 224,
    height: 224,
    alignItems: "center",
    justifyContent: "center",
  },
  circleOuter: {
    position: "absolute",
    width: 224,
    height: 224,
    borderRadius: 112,
  },
  circleInner: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  circleLabelWrap: {
    alignItems: "center",
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: "800",
  },
  muscleSubtext: {
    fontSize: 12,
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
  completeWrap: {
    alignItems: "center",
    gap: 16,
  },
  completeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(22,121,74,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtn: {
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
