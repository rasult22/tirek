import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../components/ui";
import { ErrorState } from "../../../components/ErrorState";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { useT } from "../../../lib/hooks/useLanguage";
import { cbtApi } from "../../../lib/api/cbt";
import { useThemeColors, radius, spacing } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import type { ThoughtDiaryData, CbtEntry } from "@tirek/shared";

const STEP_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#F43F5E", "#22C55E"];

const DISTORTION_KEYS = [
  "catastrophizing",
  "blackWhite",
  "mindReading",
  "fortuneTelling",
  "personalization",
  "overgeneralization",
  "shouldStatements",
  "emotionalReasoning",
  "labeling",
  "magnification",
] as const;

export default function ThoughtDiaryScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [emotionIntensity, setEmotionIntensity] = useState(5);
  const [distortion, setDistortion] = useState("");
  const [alternative, setAlternative] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const {
    data: history,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cbt", "list", "thought_diary"],
    queryFn: () => cbtApi.list("thought_diary"),
  });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const createMutation = useMutation({
    mutationFn: cbtApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
      setCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      label: t.cbt.situation,
      placeholder: t.cbt.situationPlaceholder,
      value: situation,
      set: setSituation,
    },
    {
      label: t.cbt.thought,
      placeholder: t.cbt.thoughtPlaceholder,
      value: thought,
      set: setThought,
    },
    {
      label: t.cbt.emotion,
      placeholder: t.cbt.emotionPlaceholder,
      value: emotion,
      set: setEmotion,
      hasIntensity: true,
    },
    {
      label: t.cbt.distortion,
      placeholder: t.cbt.distortionPlaceholder,
      value: distortion,
      set: setDistortion,
      isDistortion: true,
    },
    {
      label: t.cbt.alternative,
      placeholder: t.cbt.alternativePlaceholder,
      value: alternative,
      set: setAlternative,
    },
  ];

  const currentStep = steps[step];
  const canProceed =
    step === 3 ? true : (currentStep?.value?.trim().length ?? 0) > 0;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      createMutation.mutate({
        type: "thought_diary",
        data: {
          situation,
          thought,
          emotion,
          emotionIntensity,
          distortion: distortion || undefined,
          alternative: alternative || undefined,
        },
      });
    }
  };

  const handleReset = () => {
    setStep(0);
    setSituation("");
    setThought("");
    setEmotion("");
    setEmotionIntensity(5);
    setDistortion("");
    setAlternative("");
    setCompleted(false);
  };

  // --- Completed screen ---
  if (completed) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: t.cbt.thoughtDiary }} />
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={48} color={c.success} />
          </View>
          <Text style={[styles.doneTitle, { color: c.text }]}>{t.cbt.saved}</Text>
          <View style={styles.doneActions}>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { backgroundColor: c.surface },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: c.text }]}>{t.common.next}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.primaryBtnText}>{t.common.done}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // --- History screen ---
  if (showHistory) {
    const entries = history?.data ?? [];
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: t.cbt.entries }} />
        <ScrollView
          contentContainerStyle={styles.historyScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        >
          {/* Back to form */}
          <Pressable
            onPress={() => setShowHistory(false)}
            style={styles.backToForm}
          >
            <Ionicons name="arrow-back" size={18} color={c.primary} />
            <Text style={[styles.backToFormText, { color: c.primary }]}>{t.cbt.thoughtDiary}</Text>
          </Pressable>

          {entries.length === 0 && (
            <Text style={[styles.noEntries, { color: c.textLight }]}>{t.cbt.noEntries}</Text>
          )}

          {entries.map((entry: CbtEntry) => {
            const d = entry.data as ThoughtDiaryData;
            return (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: c.surface }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: c.textLight }]}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Text>
                  <Pressable onPress={() => setDeleteEntryId(entry.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={`${c.danger}80`}
                    />
                  </Pressable>
                </View>
                <View style={styles.entryBody}>
                  <EntryField label={t.cbt.situation} value={d.situation} color="#3B82F6" textColor={c.text} />
                  <EntryField label={t.cbt.thought} value={d.thought} color="#8B5CF6" textColor={c.text} />
                  <EntryField
                    label={t.cbt.emotion}
                    value={`${d.emotion}${d.emotionIntensity ? ` (${d.emotionIntensity}/10)` : ""}`}
                    color="#F59E0B"
                    textColor={c.text}
                  />
                  {d.distortion && (
                    <EntryField label={t.cbt.distortion} value={d.distortion} color="#F43F5E" textColor={c.text} />
                  )}
                  {d.alternative && (
                    <EntryField label={t.cbt.alternative} value={d.alternative} color="#22C55E" textColor={c.text} />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <ConfirmDialog
          open={deleteEntryId !== null}
          onConfirm={() => {
            if (deleteEntryId) deleteMutation.mutate(deleteEntryId);
            setDeleteEntryId(null);
          }}
          onCancel={() => setDeleteEntryId(null)}
        />
      </View>
    );
  }

  // --- Main form ---
  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: t.cbt.thoughtDiary }} />
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  const stepColor = STEP_COLORS[step];

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen
        options={{
          title: t.cbt.thoughtDiary,
          headerRight: () => (
            <Pressable
              onPress={() => setShowHistory(true)}
              style={{ paddingHorizontal: 8 }}
            >
              <Ionicons name="book-outline" size={22} color={c.textLight} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.formScroll}
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
                i === step && [styles.dotActive, { backgroundColor: c.primary }],
                i < step && { backgroundColor: c.success },
              ]}
            />
          ))}
        </View>

        {/* Step counter */}
        <Text style={[styles.stepCounter, { color: c.textLight }]}>
          {t.cbt.step} {step + 1} / {steps.length}
        </Text>

        {/* Step badge */}
        <View style={styles.badgeWrap}>
          <View style={[styles.badge, { backgroundColor: stepColor + "20" }]}>
            <Text style={[styles.badgeText, { color: stepColor }]}>
              {step + 1}
            </Text>
          </View>
        </View>

        {/* Step label */}
        <Text style={[styles.stepLabel, { color: c.text }]}>{currentStep.label}</Text>

        {/* Distortion chips */}
        {currentStep.isDistortion ? (
          <View style={styles.chips}>
            {DISTORTION_KEYS.map((key) => {
              const label =
                t.cbt.distortions[key as keyof typeof t.cbt.distortions];
              const selected = distortion === label;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setDistortion(selected ? "" : label);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.chip,
                    { backgroundColor: c.surface },
                    selected && {
                      backgroundColor: "#F43F5E",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: c.text },
                      selected && { color: "#FFFFFF" },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <TextInput
            value={currentStep.value}
            onChangeText={currentStep.set}
            placeholder={currentStep.placeholder}
            placeholderTextColor={`${c.textLight}60`}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.textarea, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
          />
        )}

        {/* Emotion intensity slider */}
        {currentStep.hasIntensity && (
          <View style={styles.sliderWrap}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderLabel, { color: c.textLight }]}>{t.cbt.emotionIntensity}</Text>
              <Text style={styles.sliderValue}>{emotionIntensity}/10</Text>
            </View>
            {/* Custom step-based intensity selector */}
            <View style={styles.intensityRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                <Pressable
                  key={val}
                  onPress={() => {
                    setEmotionIntensity(val);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.intensityDot,
                    { borderColor: c.border },
                    val <= emotionIntensity && {
                      backgroundColor: "#F59E0B",
                      borderColor: "#F59E0B",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.intensityDotText,
                      { color: c.textLight },
                      val <= emotionIntensity && { color: "#FFFFFF" },
                    ]}
                  >
                    {val}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        {step > 0 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: c.surface },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={c.textLight} />
          </Pressable>
        )}
        <Pressable
          onPress={handleNext}
          disabled={!canProceed || createMutation.isPending}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: c.primary },
            !canProceed && { opacity: 0.4 },
            pressed && canProceed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
          ]}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : step < steps.length - 1 ? (
            <>
              <Text style={styles.nextBtnText}>{t.common.next}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          ) : (
            <>
              <Text style={styles.nextBtnText}>{t.common.save}</Text>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// Entry field sub-component
function EntryField({
  label,
  value,
  color,
  textColor,
}: {
  label: string;
  value: string;
  color: string;
  textColor: string;
}) {
  return (
    <View style={efStyles.row}>
      <Text style={[efStyles.label, { color }]}>{label}:</Text>
      <Text style={[efStyles.value, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const efStyles = StyleSheet.create({
  row: { marginTop: 6 },
  label: { fontSize: 12, fontWeight: "700" },
  value: { fontSize: 13, marginTop: 1 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  historyScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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

  // Badge
  badgeWrap: {
    alignItems: "center",
    marginTop: 24,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 20,
    fontWeight: "800",
  },

  // Step label
  stepLabel: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 16,
  },

  // Textarea
  textarea: {
    marginTop: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    fontSize: 14,
    minHeight: 120,
    ...shadow(1),
  },

  // Distortion chips
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadow(1),
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Intensity
  sliderWrap: {
    marginTop: 20,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    fontSize: 12,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F59E0B",
  },
  intensityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  intensityDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  intensityDotText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },
  nextBtn: {
    flex: 1,
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

  // History
  backToForm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backToFormText: {
    fontSize: 14,
    fontWeight: "700",
  },
  noEntries: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 40,
  },
  entryCard: {
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow(1),
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryDate: {
    fontSize: 12,
  },
  entryBody: {
    marginTop: 8,
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
  doneActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  secondaryBtn: {
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
    ...shadow(1),
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryBtn: {
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
    ...shadow(2),
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
