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
import { useThemeColors, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { inviteCodesApi } from "../../lib/api/inviteCodes";

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
              <Text variant="h3">{t.psychologist.generateCodes}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="close" size={22} color={c.textLight} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 480 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text variant="caption" style={styles.sectionLabel}>
                {t.psychologist.studentNamesLabel}
              </Text>
              <View
                style={[
                  styles.namesInput,
                  { borderColor: c.borderLight, backgroundColor: c.surface },
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
                variant="caption"
                style={{ color: c.textLight, marginTop: 4 }}
              >
                {studentNames.length} / 100
              </Text>

              <Text variant="caption" style={styles.sectionLabel}>
                {t.auth.selectGrade}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setGrade(null);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        grade === null ? c.primary : c.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    variant="small"
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      color: grade === null ? "#FFF" : c.textLight,
                    }}
                  >
                    {t.psychologist.codeAny}
                  </Text>
                </Pressable>
                {GRADES.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => {
                      hapticLight();
                      setGrade(grade === g ? null : g);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          grade === g ? c.primary : c.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      variant="small"
                      style={{
                        fontFamily: "DMSans-SemiBold",
                        color: grade === g ? "#FFF" : c.textLight,
                      }}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text variant="caption" style={styles.sectionLabel}>
                {t.auth.selectClass}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setClassLetter(null);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        classLetter === null ? c.primary : c.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    variant="small"
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      color: classLetter === null ? "#FFF" : c.textLight,
                    }}
                  >
                    {t.psychologist.codeAny}
                  </Text>
                </Pressable>
                {CLASS_LETTERS.map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => {
                      hapticLight();
                      setClassLetter(classLetter === l ? null : l);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          classLetter === l ? c.primary : c.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      variant="small"
                      style={{
                        fontFamily: "DMSans-SemiBold",
                        color: classLetter === l ? "#FFF" : c.textLight,
                      }}
                    >
                      {l}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </ScrollView>

            <Pressable
              onPress={() => {
                hapticLight();
                generateMutation.mutate();
              }}
              disabled={!canSubmit}
              style={[
                styles.submitBtn,
                { backgroundColor: canSubmit ? c.primary : `${c.primary}60` },
              ]}
            >
              {generateMutation.isPending && (
                <ActivityIndicator size="small" color="#FFF" />
              )}
              <Text style={styles.submitText}>{t.psychologist.generate}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  namesInput: {
    minHeight: 110,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  namesText: {
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    padding: 0,
    minHeight: 90,
  },
  chipsRow: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: 16,
  },
  submitText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "DMSans-SemiBold",
  },
});
