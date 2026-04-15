import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../components/ui";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { exercisesApi } from "../../../lib/api/exercises";
import { useThemeColors, radius, spacing } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import type { Exercise, GroundingConfig } from "@tirek/shared";

const SENSE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  eye: "eye",
  ear: "ear",
  hand: "hand-left",
  flower: "flower",
  apple: "nutrition",
};

const STEP_COLORS = [
  { bg: "rgba(59,130,246,0.15)", icon: "#3B82F6" },
  { bg: "rgba(139,92,246,0.15)", icon: "#8B5CF6" },
  { bg: "rgba(245,158,11,0.15)", icon: "#F59E0B" },
  { bg: "rgba(34,197,94,0.15)", icon: "#22C55E" },
  { bg: "rgba(244,63,94,0.15)", icon: "#F43F5E" },
];

export default function GroundingScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const { back } = useRouter();
  const { slug, exerciseId } = useLocalSearchParams<{
    slug: string;
    exerciseId: string;
  }>();

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesApi.list,
  });

  const exercise = exercises?.find((e) => e.slug === slug);
  const config = exercise?.config as GroundingConfig | undefined;
  const steps = config?.steps ?? [];

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [itemTexts, setItemTexts] = useState<string[]>([]);

  const completeMutation = useMutation({
    mutationFn: () => exercisesApi.logCompletion(slug!),
  });

  const step = steps[currentStep];
  const senseName = step
    ? language === "kz"
      ? step.senseKz
      : step.senseRu
    : "";
  const stepColor = STEP_COLORS[currentStep] ?? STEP_COLORS[0];
  const iconName = SENSE_ICONS[step?.icon as string] ?? "eye";
  const name = exercise
    ? language === "kz" && exercise.nameKz
      ? exercise.nameKz
      : exercise.nameRu
    : "";

  // Init item texts when step changes
  if (step && itemTexts.length !== step.count && !completed) {
    setItemTexts(new Array(step.count).fill(""));
  }

  const updateItem = (idx: number, value: string) => {
    setItemTexts((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const allFilled = itemTexts.length > 0 && itemTexts.every((t) => t.trim().length > 0);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setItemTexts([]);
    } else {
      setCompleted(true);
      completeMutation.mutate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (completed) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: name }} />
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={48} color={c.success} />
          </View>
          <Text style={[styles.doneTitle, { color: c.text }]}>{t.exercises.groundingDone}</Text>
          <Text style={[styles.doneDesc, { color: c.textLight }]}>{t.exercises.complete}</Text>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: name }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: c.surfaceSecondary },
                i === currentStep && [styles.dotActive, { backgroundColor: c.primary }],
                i < currentStep && { backgroundColor: c.success },
              ]}
            />
          ))}
        </View>

        {/* Step counter */}
        <Text style={[styles.stepCounter, { color: c.textLight }]}>
          {t.exercises.groundingStep} {currentStep + 1} {t.exercises.of}{" "}
          {steps.length}
        </Text>

        {/* Sense icon */}
        <View style={styles.iconWrapOuter}>
          <View style={[styles.iconWrap, { backgroundColor: stepColor.bg }]}>
            <Ionicons name={iconName} size={40} color={stepColor.icon} />
          </View>
        </View>

        {/* Instruction */}
        <Text style={[styles.instruction, { color: c.text }]}>
          {t.exercises.groundingNameItem} {step?.count} {senseName}
        </Text>

        {/* Input fields */}
        <View style={styles.inputs}>
          {itemTexts.map((text, idx) => {
            const filled = text.trim().length > 0;
            return (
              <View
                key={idx}
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.borderLight,
                  },
                  filled && {
                    backgroundColor: `${c.success}14`,
                    borderColor: `${c.success}30`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.inputBadge,
                    { borderColor: c.border },
                    filled && {
                      backgroundColor: c.success,
                      borderColor: c.success,
                    },
                  ]}
                >
                  {filled ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.inputBadgeText, { color: c.textLight }]}>{idx + 1}</Text>
                  )}
                </View>
                <TextInput
                  value={text}
                  onChangeText={(val) => updateItem(idx, val)}
                  placeholder={`${idx + 1}...`}
                  placeholderTextColor={`${c.textLight}60`}
                  style={[styles.textInput, { color: c.text }]}
                  autoFocus={idx === 0}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Next button */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleNext}
          disabled={!allFilled}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: c.primary },
            !allFilled && { opacity: 0.4 },
            pressed && allFilled && { opacity: 0.9, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={styles.nextBtnText}>
            {currentStep < steps.length - 1 ? t.common.next : t.common.done}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Progress dots
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    width: 32,
  },

  stepCounter: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
  },

  // Icon
  iconWrapOuter: {
    alignItems: "center",
    marginTop: 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Instruction
  instruction: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 20,
    paddingHorizontal: 16,
  },

  // Inputs
  inputs: {
    marginTop: 24,
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadow(1),
  },
  inputBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  inputBadgeText: {
    fontSize: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow(2),
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Done screen
  doneWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(22,121,74,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 24,
  },
  doneDesc: {
    fontSize: 14,
    marginTop: 8,
  },
  doneBtn: {
    marginTop: 32,
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
