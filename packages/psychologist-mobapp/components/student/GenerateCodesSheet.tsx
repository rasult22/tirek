import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text } from "../ui";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { inviteCodesApi } from "../../lib/api/inviteCodes";
import { colors as ds } from "@tirek/shared/design-system";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export interface GenerateCodesPrefill {
  name: string;
  grade: number | null;
  classLetter: string | null;
}

interface GenerateCodesSheetProps {
  open: boolean;
  prefill: GenerateCodesPrefill | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateCodesSheet({
  open,
  prefill,
  onClose,
  onSuccess,
}: GenerateCodesSheetProps) {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [namesText, setNamesText] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNamesText(prefill?.name ?? "");
      setGrade(prefill?.grade ?? null);
      setClassLetter(prefill?.classLetter ?? null);
    }
  }, [open, prefill]);

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
      onSuccess();
    },
  });

  const canSubmit =
    !generateMutation.isPending &&
    studentNames.length >= 1 &&
    studentNames.length <= 100;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.root}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: c.surface }]}>
            <View style={styles.handleWrap}>
              <View
                style={[styles.handle, { backgroundColor: c.borderLight }]}
              />
            </View>

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
                {t.psychologist.generateCodes}
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: c.surfaceSecondary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="close" size={18} color={c.textLight} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 14,
                  color: c.textLight,
                  marginTop: 4,
                  fontFamily: "Inter_500Medium",
                }}
              >
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                keyboardShouldPersistTaps="handled"
              >
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
              </ScrollView>

              <Text
                style={[
                  styles.sectionLabel,
                  { color: c.textLight, marginTop: spacing.lg },
                ]}
              >
                {t.auth.selectClass}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                keyboardShouldPersistTaps="handled"
              >
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
              </ScrollView>
            </ScrollView>

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
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
    maxHeight: "85%",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.xl,
    maxHeight: 480,
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
