import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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

interface SafeStep {
  promptRu: string;
  promptKz: string;
  icon: string;
  placeholderRu: string;
  placeholderKz: string;
}

const STEP_COLORS = ["#6C5CE7", "#00B894", "#F59E0B", "#E17055", "#D63384"];

export default function SafePlaceScreen() {
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
  const config = exercise?.config as { steps: SafeStep[] } | undefined;
  const steps = config?.steps ?? [];

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() =>
    new Array(steps.length).fill(""),
  );
  const [completed, setCompleted] = useState(false);

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(slug!),
  });

  const currentStep = steps[stepIndex];
  const prompt =
    language === "kz" ? currentStep?.promptKz : currentStep?.promptRu;
  const placeholder =
    language === "kz"
      ? currentStep?.placeholderKz
      : currentStep?.placeholderRu;
  const stepColor = STEP_COLORS[stepIndex % STEP_COLORS.length];
  const canProceed = answers[stepIndex]?.trim().length > 0;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setCompleted(true);
      completeMutation.mutate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleReset = () => {
    setStepIndex(0);
    setAnswers(new Array(steps.length).fill(""));
    setCompleted(false);
  };

  if (!config || steps.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.center}>
          <Text style={{ color: c.textLight }}>{t.common.error}</Text>
        </View>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: t.exercises.safePlaceName }} />
        <View style={styles.center}>
          <View
            style={[styles.completeIcon, { backgroundColor: c.success + "20" }]}
          >
            <Ionicons name="checkmark-circle" size={48} color={c.success} />
          </View>
          <Text style={[styles.completeTitle, { color: c.text }]}>
            {t.exercises.complete}
          </Text>
          <Text style={[styles.completeSubtitle, { color: c.textLight }]}>
            {t.exercises.safePlaceIntro}
          </Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.retryBtn,
              { backgroundColor: c.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>{t.common.retry}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: t.exercises.safePlaceName }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= stepIndex
                  ? { backgroundColor: STEP_COLORS[i % STEP_COLORS.length] }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            />
          ))}
        </View>

        {/* Step counter */}
        <View style={styles.stepHeader}>
          <View style={[styles.stepBadge, { backgroundColor: stepColor }]}>
            <Text style={styles.stepBadgeText}>
              {stepIndex + 1}/{steps.length}
            </Text>
          </View>
        </View>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <View
            style={[styles.iconCircle, { backgroundColor: stepColor + "20" }]}
          >
            <Ionicons
              name={(currentStep.icon as any) || "help-circle-outline"}
              size={36}
              color={stepColor}
            />
          </View>
        </View>

        {/* Prompt */}
        <Text style={[styles.promptText, { color: c.text }]}>{prompt}</Text>

        {/* Input */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.surface,
              borderColor: c.borderLight,
              color: c.text,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={c.textLight}
          value={answers[stepIndex]}
          onChangeText={(text) => {
            const newAnswers = [...answers];
            newAnswers[stepIndex] = text;
            setAnswers(newAnswers);
          }}
          multiline
          textAlignVertical="top"
        />

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {stepIndex > 0 ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: c.surface, borderColor: c.borderLight },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="arrow-back" size={18} color={c.text} />
              <Text style={[styles.backBtnText, { color: c.text }]}>
                {t.common.back}
              </Text>
            </Pressable>
          ) : (
            <View />
          )}

          <Pressable
            onPress={handleNext}
            disabled={!canProceed}
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: stepColor },
              !canProceed && { opacity: 0.4 },
              pressed && canProceed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.nextBtnText}>
              {stepIndex < steps.length - 1 ? t.common.next : t.common.done}
            </Text>
            <Ionicons
              name={
                stepIndex < steps.length - 1
                  ? "arrow-forward"
                  : "checkmark"
              }
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },

  stepHeader: { alignItems: "center", marginTop: 20 },
  stepBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

  iconWrap: { alignItems: "center", marginTop: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  promptText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
    marginTop: 20,
    marginHorizontal: 8,
  },

  input: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    fontSize: 14,
    minHeight: 120,
    lineHeight: 22,
    fontFamily: "Nunito-Regular",
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...shadow(2),
  },
  nextBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  completeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  completeTitle: { fontSize: 20, fontWeight: "800" },
  completeSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
    ...shadow(2),
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
