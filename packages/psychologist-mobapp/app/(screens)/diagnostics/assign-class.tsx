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
import { Text, Button, Stepper, type StepperStep } from "../../../components/ui";
import { useThemeColors, radius, spacing } from "../../../lib/theme";
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

  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string>("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [studentMessage, setStudentMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const steps: StepperStep[] = [
    { id: "class", label: t.psychologist.assignSelectGrade },
    { id: "details", label: t.psychologist.assignDueDateLabel },
    { id: "preview", label: t.psychologist.assignSuccessTitle },
  ];

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
  const canGoNext = (step === 0 && grade !== null) || step === 1;
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
            <Text variant="bodyLight" style={{ marginBottom: spacing.sm }}>
              {testName}
            </Text>
          )}

          {/* Stepper */}
          <View style={styles.stepperWrap}>
            <Stepper steps={steps} current={step} />
          </View>

          {/* Step content */}
          <View
            style={[
              styles.card,
              { backgroundColor: c.surface, borderColor: c.borderLight },
            ]}
          >
            {step === 0 && (
              <>
                <Text style={[styles.fieldLabel, { color: c.text }]}>
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
                            : {
                                backgroundColor: c.surfaceSecondary,
                                borderColor: c.borderLight,
                                borderWidth: 1,
                              },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: "Inter_600SemiBold",
                            color: active ? "#FFF" : c.text,
                          }}
                        >
                          {g}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: c.text, marginTop: spacing.lg },
                  ]}
                >
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
                        : {
                            backgroundColor: c.surfaceSecondary,
                            borderColor: c.borderLight,
                            borderWidth: 1,
                          },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: "Inter_600SemiBold",
                        color: classLetter === "" ? "#FFF" : c.text,
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
                            : {
                                backgroundColor: c.surfaceSecondary,
                                borderColor: c.borderLight,
                                borderWidth: 1,
                              },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: "Inter_600SemiBold",
                            color: active ? "#FFF" : c.text,
                          }}
                        >
                          {l}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {step === 1 && (
              <>
                <Text style={[styles.fieldLabel, { color: c.text }]}>
                  {t.psychologist.assignDueDateLabel}
                </Text>
                <View style={styles.dueDateRow}>
                  <View
                    style={[
                      styles.dateInput,
                      { borderColor: c.borderLight, backgroundColor: c.bg },
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
                        { borderColor: c.borderLight, backgroundColor: c.bg },
                      ]}
                    >
                      <Ionicons name="close" size={14} color={c.textLight} />
                      <Text variant="caption" style={{ color: c.textLight }}>
                        {t.psychologist.assignDueDateClear}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: c.text, marginTop: spacing.lg },
                  ]}
                >
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
                      backgroundColor: c.bg,
                    },
                  ]}
                />
                <Text
                  variant="caption"
                  style={{ marginTop: 4, color: c.textLight }}
                >
                  {studentMessage.length} / {STUDENT_MESSAGE_MAX} —{" "}
                  {t.psychologist.studentMessageMaxHint}
                </Text>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={[styles.previewTitle, { color: c.text }]}>
                  {t.psychologist.assignSuccessTitle}
                </Text>
                <PreviewRow
                  icon="clipboard-outline"
                  label={t.psychologist.diagnostics}
                  value={testName}
                  c={c}
                />
                <PreviewRow
                  icon="people-outline"
                  label={t.psychologist.assignSelectGrade}
                  value={
                    classLabel ||
                    (classLetter
                      ? `— · ${classLetter}`
                      : t.psychologist.allClasses)
                  }
                  c={c}
                />
                <PreviewRow
                  icon="calendar-outline"
                  label={t.psychologist.assignDueDateLabel}
                  value={dueDate || "—"}
                  c={c}
                />
                {studentMessage.trim() && (
                  <PreviewRow
                    icon="chatbubble-outline"
                    label={t.psychologist.assignMessageOptionalLabel}
                    value={studentMessage.trim()}
                    c={c}
                    last
                  />
                )}
                {mutation.isError && (
                  <View
                    style={[
                      styles.errorBanner,
                      { backgroundColor: `${c.danger}1A` },
                    ]}
                  >
                    <Text variant="body" style={{ color: c.danger }}>
                      {t.common.error}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Step navigation */}
          <View style={styles.navRow}>
            <Pressable
              onPress={() => {
                hapticLight();
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step === 0}
              style={[
                styles.navBack,
                { borderColor: c.borderLight, backgroundColor: c.surface },
                step === 0 && { opacity: 0.4 },
              ]}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: c.textLight,
                }}
              >
                {t.common.back}
              </Text>
            </Pressable>
            {step < steps.length - 1 ? (
              <Button
                title={t.common.next}
                variant="primary"
                size="md"
                onPress={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                disabled={!canGoNext}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            ) : (
              <Button
                title={submitLabel}
                variant="primary"
                size="md"
                onPress={() => mutation.mutate()}
                disabled={!canSubmit}
                loading={mutation.isPending}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function PreviewRow({
  icon,
  label,
  value,
  c,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  c: ReturnType<typeof useThemeColors>;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.previewRow,
        !last && { borderBottomColor: c.borderLight, borderBottomWidth: 1 },
      ]}
    >
      <Ionicons name={icon} size={14} color={c.textLight} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            lineHeight: 14,
            color: c.textLight,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            fontFamily: "Inter_500Medium",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: c.text,
            fontFamily: "Inter_500Medium",
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    gap: spacing.md,
  },
  stepperWrap: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  chipsContainer: {
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  chip: {
    minWidth: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  previewTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  previewRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 10,
  },
  errorBanner: {
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  navBack: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
