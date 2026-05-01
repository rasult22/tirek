import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../lib/hooks/useLanguage";
import { Text } from "../components/ui";
import { useThemeColors, radius, spacing } from "../lib/theme";
import { hapticLight } from "../lib/haptics";
import { inviteCodesApi } from "../lib/api/inviteCodes";
import { colors as ds } from "@tirek/shared/design-system";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export default function GenerateCodesModal() {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    name?: string;
    grade?: string;
    classLetter?: string;
  }>();

  const initialGrade =
    params.grade && /^\d+$/.test(params.grade) ? Number(params.grade) : null;
  const initialClassLetter =
    params.classLetter && params.classLetter.length > 0
      ? params.classLetter
      : null;

  const [namesText, setNamesText] = useState(params.name ?? "");
  const [grade, setGrade] = useState<number | null>(initialGrade);
  const [classLetter, setClassLetter] = useState<string | null>(
    initialClassLetter,
  );

  const studentNames = namesText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const generateMutation = useMutation({
    mutationFn: () => {
      if (studentNames.length < 1) {
        throw new Error(t.psychologist.namesEmptyError);
      }
      if (studentNames.length > 100) {
        throw new Error(t.psychologist.namesTooManyError);
      }
      return inviteCodesApi.generate({
        studentNames,
        grade: grade ?? undefined,
        classLetter: classLetter ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
      router.dismiss();
      router.setParams({ segment: "pending" });
    },
  });

  const canSubmit =
    !generateMutation.isPending &&
    studentNames.length >= 1 &&
    studentNames.length <= 100;

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>
          {t.psychologist.generateCodes}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.sectionLabel, { color: c.textLight }]}>
          {t.psychologist.studentNamesLabel}
        </Text>
        <View
          style={[
            styles.namesInput,
            { borderColor: c.borderLight, backgroundColor: c.bg },
          ]}
        >
          <TextInput
            value={namesText}
            onChangeText={setNamesText}
            multiline
            numberOfLines={6}
            placeholder={t.psychologist.studentNamesPlaceholder}
            style={[styles.namesText, { color: c.text }]}
            placeholderTextColor={c.textLight}
            textAlignVertical="top"
          />
        </View>
        <Text style={[styles.counter, { color: c.textLight }]}>
          {studentNames.length} / 100
        </Text>

        <Text
          style={[
            styles.sectionLabel,
            { color: c.textLight, marginTop: spacing.lg },
          ]}
        >
          {t.auth.selectGrade}
        </Text>
        <View style={styles.chipsRow}>
          <Chip
            label={t.psychologist.codeAny}
            active={grade === null}
            onPress={() => {
              hapticLight();
              setGrade(null);
            }}
            c={c}
          />
          {GRADES.map((g) => (
            <Chip
              key={g}
              label={String(g)}
              active={grade === g}
              onPress={() => {
                hapticLight();
                setGrade(grade === g ? null : g);
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
          {t.auth.selectClass}
        </Text>
        <View style={styles.chipsRow}>
          <Chip
            label={t.psychologist.codeAny}
            active={classLetter === null}
            onPress={() => {
              hapticLight();
              setClassLetter(null);
            }}
            c={c}
          />
          {CLASS_LETTERS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={classLetter === l}
              onPress={() => {
                hapticLight();
                setClassLetter(classLetter === l ? null : l);
              }}
              c={c}
            />
          ))}
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: c.borderLight }]}>
        <Pressable
          onPress={() => {
            hapticLight();
            generateMutation.mutate();
          }}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            { backgroundColor: c.primary },
            !canSubmit && { opacity: 0.5 },
          ]}
        >
          {generateMutation.isPending && (
            <ActivityIndicator size="small" color="#FFF" />
          )}
          <Text style={styles.submitText}>{t.psychologist.generate}</Text>
        </Pressable>
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
  namesInput: {
    minHeight: 110,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  namesText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
    minHeight: 90,
  },
  counter: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
    fontFamily: "Inter_500Medium",
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.lg,
  },
  submitText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
});
