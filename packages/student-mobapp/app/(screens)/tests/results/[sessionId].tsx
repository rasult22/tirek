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
import { useThemeColors, radius } from "../../../../lib/theme";
import { shadow } from "../../../../lib/theme/shadows";

export default function TestResultScreen() {
  const t = useT();
  const c = useThemeColors();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { replace } = useRouter();

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
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !result) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
      <View style={styles.content}>
        <View style={[styles.resultCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
          <Text style={styles.emoji}>{"\u2705"}</Text>
          <Text variant="h1" style={styles.resultTitle}>
            {t.tests.result}
          </Text>
          <Text style={[styles.thankYou, { color: c.text }]}>
            {t.tests.resultThanks}
          </Text>
          <Text style={[styles.resultMessage, { color: c.textLight }]}>
            {t.tests.resultSent}
          </Text>
          <Text style={[styles.resultTip, { color: c.primary }]}>
            {t.tests.resultTip}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => replace("/(tabs)/chat")}
            style={({ pressed }) => [
              styles.chatBtn,
              { backgroundColor: c.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
            <Text style={styles.chatBtnText}>{t.chat.title}</Text>
          </Pressable>

          <Pressable
            onPress={() => replace("/")}
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
  emoji: { fontSize: 56 },
  resultTitle: { marginTop: 12 },
  thankYou: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  resultMessage: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  resultTip: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: { width: "100%", maxWidth: 360, marginTop: 24, gap: 12 },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 14,
    ...shadow(2),
  },
  chatBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
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
