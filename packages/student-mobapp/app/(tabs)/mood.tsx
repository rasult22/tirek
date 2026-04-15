import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { moodApi } from "../../lib/api/mood";
import { moodLevels } from "@tirek/shared";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticSelection, hapticSuccess } from "../../lib/haptics";

const FACTORS = [
  { key: "school", emoji: "\u{1F4DA}" },
  { key: "friends", emoji: "\u{1F46B}" },
  { key: "family", emoji: "\u{1F3E0}" },
  { key: "health", emoji: "\u{1F4AA}" },
  { key: "social", emoji: "\u{1F4F1}" },
  { key: "other", emoji: "\u{1F4A1}" },
] as const;

function SliderRow({
  label,
  value,
  onChange,
  valueLabels,
  colors: c,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  valueLabels?: string[];
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: c.text }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: c.primaryDark }]}>
          {valueLabels?.[value - 1] ?? `${value}/5`}
        </Text>
      </View>
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5].map((v) => (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[
              styles.sliderDot,
              {
                backgroundColor: v <= value ? c.primary : c.borderLight,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function MoodScreen() {
  const t = useT();
  const { push, navigate } = useRouter();
  const c = useThemeColors();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [stress, setStress] = useState(3);
  const [factors, setFactors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const moodLabels: Record<number, string> = {
    1: t.mood.level1,
    2: t.mood.level2,
    3: t.mood.level3,
    4: t.mood.level4,
    5: t.mood.level5,
  };

  const factorLabels: Record<string, string> = {
    school: t.mood.factorSchool,
    friends: t.mood.factorFriends,
    family: t.mood.factorFamily,
    health: t.mood.factorHealth,
    social: t.mood.factorSocial,
    other: t.mood.factorOther,
  };

  const toggleFactor = (key: string) => {
    hapticSelection();
    setFactors((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      moodApi.create({
        mood: mood!,
        energy,
        sleepQuality: sleep,
        stressLevel: stress,
        factors: factors.length > 0 ? factors : null,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      hapticSuccess();
      setSaved(true);
      setTimeout(() => navigate("/"), 1500);
    },
  });

  if (saved) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <View style={styles.savedContainer}>
          <View style={styles.savedIcon}>
            <Ionicons name="checkmark" size={40} color={c.secondary} />
          </View>
          <Text variant="h2" style={styles.savedText}>
            {t.mood.saved}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1">{t.mood.checkin}</Text>
          <Pressable
            onPress={() => push("/(screens)/mood-calendar")}
            style={({ pressed }) => [
              styles.calendarBtn,
              { backgroundColor: c.surface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="calendar" size={20} color={c.primary} />
          </Pressable>
        </View>

        {/* Mood selector */}
        <View style={styles.moodRow}>
          {moodLevels.map((level) => (
            <Pressable
              key={level.value}
              onPress={() => { hapticSelection(); setMood(level.value); }}
              style={[
                styles.moodBtn,
                mood === level.value && [
                  styles.moodBtnActive,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.primary,
                  },
                ],
              ]}
            >
              <Text style={styles.moodEmoji}>{level.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  { color: c.textLight },
                  mood === level.value && { color: c.primary },
                ]}
              >
                {moodLabels[level.value]}
              </Text>
            </Pressable>
          ))}
        </View>

        {mood !== null && (
          <View style={styles.details}>
            {/* Sliders */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: c.surface,
                  borderColor: c.borderLight,
                },
              ]}
            >
              <SliderRow
                label={t.mood.energy}
                value={energy}
                onChange={setEnergy}
                valueLabels={t.mood.energyLabels as unknown as string[]}
                colors={c}
              />
              <View style={styles.sliderSpacer} />
              <SliderRow
                label={t.mood.sleep}
                value={sleep}
                onChange={setSleep}
                valueLabels={t.mood.sleepLabels as unknown as string[]}
                colors={c}
              />
              <View style={styles.sliderSpacer} />
              <SliderRow
                label={t.mood.stress}
                value={stress}
                onChange={setStress}
                valueLabels={t.mood.stressLabels as unknown as string[]}
                colors={c}
              />
            </View>

            {/* Factors */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: c.surface,
                  borderColor: c.borderLight,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: c.text }]}>
                {t.mood.factors}
              </Text>
              <View style={styles.factorGrid}>
                {FACTORS.map(({ key, emoji }) => (
                  <Pressable
                    key={key}
                    onPress={() => toggleFactor(key)}
                    style={[
                      styles.factorChip,
                      {
                        backgroundColor: factors.includes(key)
                          ? c.primary
                          : c.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text style={styles.factorEmoji}>{emoji}</Text>
                    <Text
                      style={[
                        styles.factorText,
                        {
                          color: factors.includes(key) ? "#FFFFFF" : c.text,
                        },
                      ]}
                    >
                      {factorLabels[key]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Note */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: c.surface,
                  borderColor: c.borderLight,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: c.text }]}>
                {t.mood.note}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t.mood.notePlaceholder}
                placeholderTextColor={c.textLight}
                multiline
                numberOfLines={3}
                style={[
                  styles.noteInput,
                  {
                    borderColor: c.borderLight,
                    backgroundColor: c.surfaceSecondary,
                    color: c.text,
                  },
                ]}
                textAlignVertical="top"
              />
            </View>

            {/* Error */}
            {submitMutation.isError && (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { color: c.danger }]}>
                  {t.common.error}
                </Text>
              </View>
            )}

            {/* Submit */}
            <Pressable
              onPress={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                submitMutation.isPending && { opacity: 0.6 },
              ]}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.submitText}>{t.common.save}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },

  moodRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
  },
  moodBtn: {
    alignItems: "center",
    gap: 6,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  moodBtnActive: {
    borderWidth: 2,
    ...shadow(2),
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 10, fontWeight: "700" },

  details: { marginTop: 24, gap: 16 },

  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadow(1),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },

  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabel: { fontSize: 12, fontWeight: "700" },
  sliderValue: { fontSize: 12, fontWeight: "700" },
  sliderTrack: { flexDirection: "row", gap: 8 },
  sliderDot: { flex: 1, height: 12, borderRadius: 6 },
  sliderSpacer: { height: 20 },

  factorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  factorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  factorEmoji: { fontSize: 14 },
  factorText: { fontSize: 12, fontWeight: "700" },

  noteInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
  },

  errorBox: {
    backgroundColor: "rgba(179,59,59,0.08)",
    borderWidth: 1,
    borderColor: "rgba(179,59,59,0.15)",
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  errorText: { fontSize: 14, fontWeight: "500" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow(2),
  },
  submitText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  savedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  savedIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(45,109,140,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  savedText: { marginTop: 16 },
});
