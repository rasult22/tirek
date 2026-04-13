import { useState, useEffect } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../components/ui";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { testsApi } from "../../../lib/api/tests";
import { testDefinitions } from "@tirek/shared";
import { useThemeColors, radius, spacing } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";

export default function TestScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const router = useRouter();

  const testDef = testDefinitions[testId as keyof typeof testDefinitions];
  const questions = testDef?.questions ?? [];
  const options = testDef?.options ?? [];

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const startMutation = useMutation({
    mutationFn: () => testsApi.start(testId!),
    onSuccess: (session) =>
      setSessionId((session as any).sessionId ?? session.id),
  });

  const answerMutation = useMutation({
    mutationFn: (data: { questionIndex: number; answer: number }) =>
      testsApi.answer(sessionId!, data),
  });

  const completeMutation = useMutation({
    mutationFn: () => testsApi.complete(sessionId!),
    onSuccess: (session) =>
      router.replace({
        pathname: "/(screens)/tests/results/[sessionId]",
        params: {
          sessionId: (session as any).sessionId ?? session.id,
        },
      }),
  });

  useEffect(() => {
    if (testDef && !sessionId) {
      startMutation.mutate();
    }
  }, [testId]);

  if (!testDef) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.centered}>
          <Text style={{ color: c.textLight }}>{t.common.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;
  const currentAnswer = answers[currentQ];

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: value }));
  };

  const handleNext = () => {
    const answer = answers[currentQ];
    if (answer !== undefined && sessionId) {
      answerMutation.mutate({ questionIndex: currentQ, answer });
    }
    if (isLast) {
      completeMutation.mutate();
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: c.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
        <Text style={[styles.progress, { color: c.textLight }]}>
          {t.tests.question} {currentQ + 1} {t.tests.of} {questions.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: c.surfaceSecondary }]}>
        <View
          style={[styles.progressFill, { width: `${progress}%`, backgroundColor: c.primary }]}
        />
      </View>

      {/* Question */}
      <View style={styles.questionArea}>
        <Text style={[styles.questionText, { color: c.text }]}>
          {language === "kz" ? question.textKz : question.textRu}
        </Text>

        {/* Options */}
        <View style={styles.optionsList}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => handleSelect(opt.value)}
              style={[
                styles.optionBtn,
                {
                  borderColor: c.borderLight,
                  backgroundColor: c.surface,
                },
                currentAnswer === opt.value && {
                  borderColor: c.primaryDark,
                  backgroundColor: `${c.primary}1A`,
                },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  { borderColor: c.inputBorder },
                  currentAnswer === opt.value && {
                    borderColor: c.primaryDark,
                    backgroundColor: c.primaryDark,
                  },
                ]}
              >
                {currentAnswer === opt.value && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.optionText, { color: c.text }]}>
                {language === "kz" ? opt.labelKz : opt.labelRu}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <Pressable
          onPress={() => setCurrentQ(currentQ - 1)}
          disabled={currentQ === 0}
          style={({ pressed }) => [
            styles.prevBtn,
            {
              borderColor: c.border,
              backgroundColor: c.surface,
            },
            currentQ === 0 && { opacity: 0.3 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
        <Pressable
          onPress={handleNext}
          disabled={currentAnswer === undefined || completeMutation.isPending}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: c.primary },
            (currentAnswer === undefined || completeMutation.isPending) && {
              opacity: 0.4,
            },
            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
          ]}
        >
          {completeMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isLast ? (
            <>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.nextText}>{t.tests.submit}</Text>
            </>
          ) : (
            <>
              <Text style={styles.nextText}>{t.common.next}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },
  progress: {
    fontSize: 12,
    fontWeight: "700",
  },

  progressBar: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 20,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },

  questionArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  optionsList: { marginTop: 24, gap: 12 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1, fontSize: 14, fontWeight: "500" },

  navRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
  },
  prevBtn: {
    width: 56,
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },
  nextBtn: {
    flex: 1,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    ...shadow(2),
  },
  nextText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
