import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useT } from "../lib/hooks/useLanguage";
import { Text, Button } from "../components/ui";
import { useThemeColors, radius, spacing } from "../lib/theme";
import { hapticLight } from "../lib/haptics";
import { colors as ds } from "@tirek/shared/design-system";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export default function StudentsFiltersModal() {
  const t = useT();
  const c = useThemeColors();
  const params = useLocalSearchParams<{
    grade?: string;
    classLetter?: string;
  }>();

  const initialGrade =
    params.grade && /^\d+$/.test(params.grade) ? Number(params.grade) : null;
  const initialClassLetter =
    params.classLetter && params.classLetter.length > 0
      ? params.classLetter
      : null;

  const [draftGrade, setDraftGrade] = useState<number | null>(initialGrade);
  const [draftLetter, setDraftLetter] = useState<string | null>(
    initialClassLetter,
  );

  function handleApply() {
    router.dismiss();
    router.setParams({
      grade: draftGrade != null ? String(draftGrade) : "",
      classLetter: draftLetter ?? "",
    });
  }

  function handleReset() {
    setDraftGrade(null);
    setDraftLetter(null);
  }

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>{t.common.filters}</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.sectionLabel, { color: c.textLight }]}>
          {t.psychologist.studentClass}
        </Text>
        <View style={styles.chipsRow}>
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
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: c.textLight, marginTop: spacing.lg },
          ]}
        >
          {t.psychologist.classLetterLabel}
        </Text>
        <View style={styles.chipsRow}>
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
        </View>
      </View>

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
  root: {},
  headerRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "Inter_700Bold",
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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
    flexWrap: "wrap",
    alignItems: "center",
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
