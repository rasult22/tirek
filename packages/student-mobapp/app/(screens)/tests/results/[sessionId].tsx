import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../../components/ui";
import { ErrorState } from "../../../../components/ErrorState";
import { useT } from "../../../../lib/hooks/useLanguage";
import { testsApi } from "../../../../lib/api/tests";
import type { SessionResult } from "../../../../lib/api/tests";
import type { Severity } from "@tirek/shared";
import { useThemeColors, radius } from "../../../../lib/theme";
import { shadow } from "../../../../lib/theme/shadows";

const SEVERITY_CONFIG: Record<
  Severity,
  { emoji: string; bg: string; border: string }
> = {
  minimal: { emoji: "\u{1F60A}", bg: "#F0FDF4", border: "#BBF7D0" },
  mild: { emoji: "\u{1F642}", bg: "#FEFCE8", border: "#FDE68A" },
  moderate: { emoji: "\u{1F914}", bg: "#FFF7ED", border: "#FED7AA" },
  severe: { emoji: "\u{1F917}", bg: "#FEF2F2", border: "#FECACA" },
};

export default function TestResultScreen() {
  const t = useT();
  const c = useThemeColors();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();

  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useQuery<SessionResult>({
    queryKey: ["test", "result", sessionId],
    queryFn: () => testsApi.session(sessionId!),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.centered}>
          <Text style={{ color: c.textLight }}>{t.common.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sev = result.severity ?? "minimal";
  const config = SEVERITY_CONFIG[sev];
  const resultMessages: Record<Severity, string> = {
    minimal: t.tests.resultGood,
    mild: t.tests.resultMild,
    moderate: t.tests.resultModerate,
    severe: t.tests.resultSevere,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        {/* Result card */}
        <View
          style={[
            styles.resultCard,
            { backgroundColor: config.bg, borderColor: config.border },
          ]}
        >
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text variant="h1" style={styles.resultTitle}>
            {t.tests.result}
          </Text>
          <Text style={[styles.resultMessage, { color: c.text }]}>{resultMessages[sev]}</Text>
          {result.message && (
            <Text style={[styles.resultNote, { color: c.textLight }]}>{result.message}</Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {(sev === "moderate" || sev === "severe") && (
            <Pressable
              onPress={() => router.replace("/(tabs)/chat")}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons
                name="chatbubble"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.primaryBtnText}>{t.chat.title}</Text>
            </Pressable>
          )}

          {(sev === "mild" || sev === "moderate") && (
            <Pressable
              onPress={() => router.replace("/(tabs)/exercises")}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="leaf" size={18} color={c.secondary} />
              <Text style={[styles.secondaryBtnText, { color: c.secondary }]}>
                {t.exercises.title}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.replace("/")}
            style={({ pressed }) => [
              styles.homeBtn,
              { backgroundColor: c.surface },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="home" size={18} color={c.text} />
            <Text style={[styles.homeBtnText, { color: c.text }]}>{t.nav.home}</Text>
          </Pressable>
        </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  resultCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: "center",
  },
  emoji: { fontSize: 64 },
  resultTitle: { marginTop: 16 },
  resultMessage: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  resultNote: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  actions: { width: "100%", maxWidth: 360, marginTop: 24, gap: 12 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 14,
    ...shadow(2),
  },
  primaryBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(45,109,140,0.2)",
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },

  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 14,
    ...shadow(1),
  },
  homeBtnText: { fontSize: 14, fontWeight: "700" },
});
