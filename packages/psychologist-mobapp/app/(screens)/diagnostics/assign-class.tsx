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
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { testDefinitions } from "@tirek/shared";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { Text } from "../../../components/ui";
import { useThemeColors, radius } from "../../../lib/theme";
import { diagnosticsApi } from "../../../lib/api/diagnostics";
import { hapticLight } from "../../../lib/haptics";

const STUDENT_MESSAGE_MAX = 500;
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function AssignToClassScreen() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ testSlug?: string }>();

  const testSlug = params.testSlug ?? "";
  const td =
    testSlug && testSlug in testDefinitions
      ? testDefinitions[testSlug as keyof typeof testDefinitions]
      : null;
  const testName = td ? (language === "kz" ? td.nameKz : td.nameRu) : testSlug;

  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string>("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [studentMessage, setStudentMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      diagnosticsApi.assignTest({
        testSlug,
        target: "class",
        grade: grade ?? undefined,
        classLetter: classLetter || undefined,
        dueDate: dueDate || undefined,
        studentMessage:
          studentMessage.trim().length > 0
            ? studentMessage.trim()
            : undefined,
      }),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    },
  });

  const canSubmit = !!testSlug && grade !== null && !mutation.isPending;
  const classLabel = grade !== null ? `${grade}${classLetter}` : "";
  const submitLabel =
    grade !== null
      ? t.psychologist.assignSubmitForClass.replace("{class}", classLabel)
      : t.psychologist.assignSubmitFallbackClass;

  if (success) {
    return (
      <>
        <Stack.Screen options={{ title: t.psychologist.assignClassTitle }} />
        <View style={[styles.successContainer, { backgroundColor: c.bg }]}>
          <View
            style={[styles.successIcon, { backgroundColor: `${c.success}1A` }]}
          >
            <Ionicons name="checkmark" size={32} color={c.success} />
          </View>
          <Text variant="h2" style={{ textAlign: "center" }}>
            {t.psychologist.assignSuccessTitle}
          </Text>
          <Text
            variant="bodyLight"
            style={{ textAlign: "center", marginTop: 4 }}
          >
            {t.psychologist.assignSuccessRedirect}
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t.psychologist.assignClassTitle }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: c.bg }]}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {td && (
            <Text variant="bodyLight" style={{ marginBottom: 8 }}>
              {testName}
            </Text>
          )}

          {/* Grade chips */}
          <Text variant="body" style={styles.fieldLabel}>
            {t.psychologist.assignSelectGrade}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {GRADES.map((g) => {
              const active = grade === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    hapticLight();
                    setGrade(g);
                  }}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: c.primary }
                      : { backgroundColor: c.surfaceSecondary },
                  ]}
                >
                  <Text
                    variant="small"
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      color: active ? "#FFF" : c.textLight,
                    }}
                  >
                    {g}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Class letter chips */}
          <Text variant="body" style={[styles.fieldLabel, { marginTop: 12 }]}>
            {t.psychologist.assignSelectClassLetter}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            <Pressable
              onPress={() => {
                hapticLight();
                setClassLetter("");
              }}
              style={[
                styles.chip,
                classLetter === ""
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: classLetter === "" ? "#FFF" : c.textLight,
                }}
              >
                {t.psychologist.allClasses}
              </Text>
            </Pressable>
            {CLASS_LETTERS.map((l) => {
              const active = classLetter === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => {
                    hapticLight();
                    setClassLetter(l);
                  }}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: c.primary }
                      : { backgroundColor: c.surfaceSecondary },
                  ]}
                >
                  <Text
                    variant="small"
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      color: active ? "#FFF" : c.textLight,
                    }}
                  >
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Due date */}
          <Text variant="body" style={styles.fieldLabel}>
            {t.psychologist.assignDueDateLabel}
          </Text>
          <View style={styles.dueDateRow}>
            <View
              style={[
                styles.dateInput,
                { borderColor: c.borderLight, backgroundColor: c.surface },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={c.textLight}
              />
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.textLight}
                style={[styles.dateText, { color: c.text }]}
                maxLength={10}
              />
            </View>
            {!!dueDate && (
              <Pressable
                onPress={() => {
                  hapticLight();
                  setDueDate("");
                }}
                style={[
                  styles.clearBtn,
                  { borderColor: c.borderLight, backgroundColor: c.surface },
                ]}
              >
                <Ionicons name="close" size={14} color={c.textLight} />
                <Text variant="caption" style={{ color: c.textLight }}>
                  {t.psychologist.assignDueDateClear}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Class message */}
          <Text variant="body" style={styles.fieldLabel}>
            {t.psychologist.assignMessageOptionalLabel}
          </Text>
          <TextInput
            value={studentMessage}
            onChangeText={(v) =>
              setStudentMessage(v.slice(0, STUDENT_MESSAGE_MAX))
            }
            placeholder={t.psychologist.assignMessageClassPlaceholder}
            placeholderTextColor={c.textLight}
            multiline
            numberOfLines={3}
            maxLength={STUDENT_MESSAGE_MAX}
            style={[
              styles.messageInput,
              {
                borderColor: c.borderLight,
                color: c.text,
                backgroundColor: c.surface,
              },
            ]}
          />
          <Text variant="caption" style={{ marginTop: 4 }}>
            {studentMessage.length} / {STUDENT_MESSAGE_MAX} —{" "}
            {t.psychologist.studentMessageMaxHint}
          </Text>

          {mutation.isError && (
            <View
              style={[styles.errorBanner, { backgroundColor: `${c.danger}1A` }]}
            >
              <Text variant="body" style={{ color: c.danger }}>
                {t.common.error}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              hapticLight();
              mutation.mutate();
            }}
            disabled={!canSubmit}
            style={[
              styles.submitBtn,
              { backgroundColor: canSubmit ? c.primary : `${c.primary}60` },
            ]}
          >
            {mutation.isPending && (
              <Ionicons name="reload-outline" size={16} color="#FFF" />
            )}
            <Ionicons name="clipboard-outline" size={16} color="#FFF" />
            <Text style={styles.submitText} numberOfLines={1}>
              {submitLabel}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 8,
  },
  fieldLabel: {
    fontFamily: "DMSans-SemiBold",
    marginBottom: 4,
    marginTop: 8,
  },
  chipsContainer: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    minWidth: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    padding: 0,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  messageInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    textAlignVertical: "top",
  },
  errorBanner: {
    padding: 12,
    borderRadius: radius.sm,
    marginTop: 8,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginTop: 16,
  },
  submitText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "DMSans-SemiBold",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
});
