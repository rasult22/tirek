import { useState, useMemo } from "react";
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
import { Text, Button, Input } from "../../../components/ui";
import { Card } from "../../../components/ui/Card";
import { useThemeColors, spacing, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import { diagnosticsApi } from "../../../lib/api/diagnostics";
import { studentsApi } from "../../../lib/api/students";
import { hapticLight } from "../../../lib/haptics";

type Target = "student" | "class";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];
const STUDENT_MESSAGE_MAX = 500;

export default function AssignTestScreen() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    testSlug?: string;
    target?: string;
  }>();

  const [testSlug, setTestSlug] = useState(params.testSlug ?? "");
  const [target, setTarget] = useState<Target>(
    params.target === "student" ? "student" : "class",
  );
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentsApi.getAll(),
    enabled: target === "student",
  });

  const filteredStudents = useMemo(() => {
    if (!students?.data) return [];
    if (!studentSearch) return students.data;
    const s = studentSearch.toLowerCase();
    return students.data.filter((st) => st.name.toLowerCase().includes(s));
  }, [students, studentSearch]);

  const mutation = useMutation({
    mutationFn: () =>
      diagnosticsApi.assignTest({
        testSlug,
        target,
        studentId: target === "student" ? studentId : undefined,
        grade: target === "class" && grade ? grade : undefined,
        classLetter: target === "class" && classLetter ? classLetter : undefined,
        dueDate: dueDate || undefined,
        studentMessage:
          target === "student" && studentMessage.trim().length > 0
            ? studentMessage.trim()
            : undefined,
      }),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    },
  });

  const canSubmit =
    !!testSlug &&
    (target === "student" ? !!studentId : !!grade) &&
    !mutation.isPending;

  if (success) {
    return (
      <>
        <Stack.Screen options={{ title: t.psychologist.assignTest }} />
        <View style={[styles.successContainer, { backgroundColor: c.bg }]}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: `${c.success}1A` },
            ]}
          >
            <Ionicons name="checkmark" size={32} color={c.success} />
          </View>
          <Text variant="h2" style={{ textAlign: "center" }}>
            {t.psychologist.assignTest} ✓
          </Text>
          <Text variant="bodyLight" style={{ textAlign: "center", marginTop: 4 }}>
            {t.common.back}...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t.psychologist.assignTest }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        style={[styles.container, { backgroundColor: c.bg }]}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Select test */}
        <Text variant="h3" style={styles.sectionLabel}>
          {t.psychologist.diagnostics}
        </Text>
        {Object.values(testDefinitions).map((td) => {
          const name = language === "kz" ? td.nameKz : td.nameRu;
          const desc = language === "kz" ? td.descriptionKz : td.descriptionRu;
          const isSelected = testSlug === td.slug;
          return (
            <Pressable
              key={td.slug}
              onPress={() => {
                hapticLight();
                setTestSlug(td.slug);
              }}
              style={[
                styles.testCard,
                {
                  borderColor: isSelected ? c.primary : c.borderLight,
                  backgroundColor: isSelected
                    ? `${c.primary}0D`
                    : c.surface,
                },
                shadow(1),
              ]}
            >
              <Text
                variant="body"
                style={{ fontFamily: "DMSans-SemiBold" }}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text variant="caption" style={{ marginTop: 2 }} numberOfLines={2}>
                {desc}
              </Text>
              {isSelected && (
                <View style={[styles.checkMark, { backgroundColor: c.primary }]}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
              )}
            </Pressable>
          );
        })}

        {/* Target toggle */}
        <Text variant="h3" style={styles.sectionLabel}>
          {t.psychologist.assignToClass.split(" ")[0] === "Назначить"
            ? "Назначить кому"
            : "Assign to"}
        </Text>
        <View style={styles.targetRow}>
          <Pressable
            onPress={() => {
              hapticLight();
              setTarget("class");
            }}
            style={[
              styles.targetBtn,
              {
                borderColor: target === "class" ? c.primary : c.borderLight,
                backgroundColor:
                  target === "class" ? `${c.primary}0D` : c.surface,
              },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={target === "class" ? c.primary : c.textLight}
            />
            <Text
              variant="body"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: target === "class" ? c.primary : c.textLight,
              }}
            >
              {t.psychologist.assignToClass}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              setTarget("student");
            }}
            style={[
              styles.targetBtn,
              {
                borderColor: target === "student" ? c.primary : c.borderLight,
                backgroundColor:
                  target === "student" ? `${c.primary}0D` : c.surface,
              },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={target === "student" ? c.primary : c.textLight}
            />
            <Text
              variant="body"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: target === "student" ? c.primary : c.textLight,
              }}
            >
              {t.psychologist.assignToStudent}
            </Text>
          </Pressable>
        </View>

        {/* Class selector */}
        {target === "class" && (
          <View style={styles.classSection}>
            <Text variant="body" style={styles.fieldLabel}>
              {t.auth.selectGrade}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {GRADES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    hapticLight();
                    setGrade(grade === g ? null : g);
                  }}
                  style={[
                    styles.chip,
                    grade === g
                      ? { backgroundColor: c.primary }
                      : { backgroundColor: c.surfaceSecondary },
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

            <Text variant="body" style={[styles.fieldLabel, { marginTop: 12 }]}>
              {t.auth.selectClass}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              <Pressable
                onPress={() => {
                  hapticLight();
                  setClassLetter(null);
                }}
                style={[
                  styles.chip,
                  classLetter === null
                    ? { backgroundColor: c.primary }
                    : { backgroundColor: c.surfaceSecondary },
                ]}
              >
                <Text
                  variant="small"
                  style={{
                    fontFamily: "DMSans-SemiBold",
                    color: classLetter === null ? "#FFF" : c.textLight,
                  }}
                >
                  {t.psychologist.allClasses}
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
                    classLetter === l
                      ? { backgroundColor: c.primary }
                      : { backgroundColor: c.surfaceSecondary },
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
          </View>
        )}

        {/* Student selector */}
        {target === "student" && (
          <View style={styles.studentSection}>
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
                              fontFamily: "DMSans-SemiBold",
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
                  {t.common.noData}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Due date */}
        <Text variant="body" style={styles.fieldLabel}>
          {language === "kz" ? "Мерзімі" : "Срок"} (optional)
        </Text>
        <View
          style={[
            styles.dateInput,
            { borderColor: c.borderLight, backgroundColor: c.surface },
          ]}
        >
          <Ionicons name="calendar-outline" size={16} color={c.textLight} />
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={c.textLight}
            style={[styles.dateText, { color: c.text }]}
            maxLength={10}
          />
        </View>

        {/* Student message — only when target=student */}
        {target === "student" && (
          <>
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
                { borderColor: c.borderLight, color: c.text, backgroundColor: c.surface },
              ]}
            />
            <Text variant="caption" style={{ marginTop: 4 }}>
              {studentMessage.length} / {STUDENT_MESSAGE_MAX} —{" "}
              {t.psychologist.studentMessageMaxHint}
            </Text>
          </>
        )}

        {/* Error */}
        {mutation.isError && (
          <View style={[styles.errorBanner, { backgroundColor: `${c.danger}1A` }]}>
            <Text variant="body" style={{ color: c.danger }}>
              {t.common.error}
            </Text>
          </View>
        )}

        {/* Submit */}
        <Pressable
          onPress={() => {
            hapticLight();
            mutation.mutate();
          }}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit ? c.primary : `${c.primary}60`,
            },
          ]}
        >
          {mutation.isPending && (
            <Ionicons name="reload-outline" size={16} color="#FFF" />
          )}
          <Ionicons name="clipboard-outline" size={16} color="#FFF" />
          <Text style={styles.submitText}>{t.psychologist.assignTest}</Text>
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
  sectionLabel: {
    marginTop: 8,
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: "DMSans-SemiBold",
    marginBottom: 4,
    marginTop: 8,
  },
  testCard: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    marginBottom: 8,
    position: "relative",
  },
  checkMark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  targetRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  targetBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  classSection: {
    marginTop: 4,
  },
  chipsContainer: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  studentSection: {
    marginTop: 4,
    gap: 8,
  },
  studentList: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  studentScroll: {
    maxHeight: 200,
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
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    padding: 0,
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
    borderRadius: radius.md,
    marginTop: 12,
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
