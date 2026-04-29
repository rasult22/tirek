import { useMemo, useState } from "react";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { testDefinitions } from "@tirek/shared";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { Text, Input, Button } from "../../../components/ui";
import { useThemeColors, radius } from "../../../lib/theme";
import { diagnosticsApi } from "../../../lib/api/diagnostics";
import { studentsApi } from "../../../lib/api/students";
import { hapticLight } from "../../../lib/haptics";

const STUDENT_MESSAGE_MAX = 500;

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function AssignToStudentScreen() {
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

  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [studentMessage, setStudentMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentsApi.getAll(),
  });

  const filteredStudents = useMemo(() => {
    const list = students?.data ?? [];
    if (!studentSearch.trim()) return list;
    const q = studentSearch.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const selectedStudent = students?.data?.find((s) => s.id === studentId);

  const mutation = useMutation({
    mutationFn: () =>
      diagnosticsApi.assignTest({
        testSlug,
        target: "student",
        studentId,
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

  const canSubmit = !!testSlug && !!studentId && !mutation.isPending;

  const submitLabel = selectedStudent
    ? t.psychologist.assignSubmitForStudent.replace(
        "{name}",
        selectedStudent.name,
      )
    : t.psychologist.assignSubmitFallbackStudent;

  if (success) {
    return (
      <>
        <Stack.Screen options={{ title: t.psychologist.assignStudentTitle }} />
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
      <Stack.Screen options={{ title: t.psychologist.assignStudentTitle }} />
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

          {/* Student search */}
          <Text variant="body" style={styles.fieldLabel}>
            {t.psychologist.assignSelectStudent}
          </Text>
          <Input
            icon="search-outline"
            value={studentSearch}
            onChangeText={setStudentSearch}
            placeholder={`${t.common.search}...`}
          />
          <View
            style={[
              styles.studentList,
              { borderColor: c.borderLight, backgroundColor: c.surface },
            ]}
          >
            {filteredStudents.length > 0 ? (
              <ScrollView
                style={styles.studentScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {filteredStudents.map((s) => {
                  const isSelected = studentId === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => {
                        hapticLight();
                        setStudentId(s.id);
                      }}
                      style={[
                        styles.studentRow,
                        {
                          backgroundColor: isSelected
                            ? `${c.primary}0D`
                            : "transparent",
                          borderBottomColor: c.borderLight,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.miniAvatar,
                          { backgroundColor: `${c.primary}1A` },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "600",
                            color: c.primary,
                          }}
                        >
                          {s.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        variant="body"
                        style={{ flex: 1 }}
                        numberOfLines={1}
                      >
                        {s.name}
                      </Text>
                      <Text variant="caption">
                        {s.grade ?? ""}
                        {s.classLetter ?? ""}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={c.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text
                variant="bodyLight"
                style={{ textAlign: "center", padding: 16 }}
              >
                {t.psychologist.assignSelectStudentEmpty}
              </Text>
            )}
          </View>

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

          {/* Student message */}
          <Text variant="body" style={styles.fieldLabel}>
            {t.psychologist.studentMessageLabel}
          </Text>
          <TextInput
            value={studentMessage}
            onChangeText={(v) =>
              setStudentMessage(v.slice(0, STUDENT_MESSAGE_MAX))
            }
            placeholder={t.psychologist.studentMessagePlaceholder}
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

          <Button
            title={submitLabel}
            variant="primary"
            size="lg"
            onPress={() => mutation.mutate()}
            disabled={!canSubmit}
            loading={mutation.isPending}
            style={{ marginTop: 16 }}
          />
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
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  studentList: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    marginTop: 4,
  },
  studentScroll: {
    maxHeight: 280,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  errorBanner: {
    padding: 12,
    borderRadius: radius.sm,
    marginTop: 8,
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
