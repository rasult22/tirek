import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Button } from "../../components/ui";
import { useThemeColors, spacing } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { colors as ds } from "@tirek/shared/design-system";
import { useFiltersSheetStore } from "../../lib/sheets/filters";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export default function FiltersModal() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const payload = useFiltersSheetStore((s) => s.payload);
  const onApply = useFiltersSheetStore((s) => s.onApply);
  const close = useFiltersSheetStore((s) => s.close);

  const [draftGrade, setDraftGrade] = useState<number | null>(
    payload?.grade ?? null,
  );
  const [draftLetter, setDraftLetter] = useState<string | null>(
    payload?.classLetter ?? null,
  );

  if (!payload) return null;

  function handleApply() {
    onApply?.({ grade: draftGrade, classLetter: draftLetter });
    close();
    router.back();
  }

  function handleReset() {
    setDraftGrade(null);
    setDraftLetter(null);
  }

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={styles.headerRow}>
        <Text
          style={{
            fontSize: 18,
            lineHeight: 24,
            fontFamily: "Inter_700Bold",
            color: c.text,
            flex: 1,
          }}
        >
          {t.common.filters}
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: c.textLight }]}>
          {t.psychologist.studentClass}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label={t.psychologist.allGrades}
            active={draftGrade === null}
            onPress={() => {
              hapticLight();
              setDraftGrade(null);
            }}
            c={c}
          />
          {GRADES.map((g) => (
            <Chip
              key={g}
              label={String(g)}
              active={draftGrade === g}
              onPress={() => {
                hapticLight();
                setDraftGrade(draftGrade === g ? null : g);
              }}
              c={c}
            />
          ))}
        </ScrollView>

        <Text
          style={[
            styles.sectionLabel,
            { color: c.textLight, marginTop: spacing.lg },
          ]}
        >
          {t.psychologist.classLetterLabel}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label={t.psychologist.allClasses}
            active={draftLetter === null}
            onPress={() => {
              hapticLight();
              setDraftLetter(null);
            }}
            c={c}
          />
          {CLASS_LETTERS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={draftLetter === l}
              onPress={() => {
                hapticLight();
                setDraftLetter(draftLetter === l ? null : l);
              }}
              c={c}
            />
          ))}
        </ScrollView>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.borderLight }]}>
        <Button
          title={t.common.reset}
          variant="secondary"
          onPress={handleReset}
          style={{ flex: 1 }}
        />
        <Button
          title={t.common.apply}
          variant="primary"
          onPress={handleApply}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: ds.brandSoft, borderColor: `${c.primary}33` }
          : { backgroundColor: c.surfaceSecondary, borderColor: c.borderLight },
      ]}
    >
      <Text
        style={{
          fontSize: 13,
          fontFamily: "Inter_600SemiBold",
          color: active ? c.primaryDark : c.textLight,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  bodyContent: {
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
});
