import { View, Pressable, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../../components/ui";
import { ErrorState } from "../../../../components/ErrorState";
import { useT } from "../../../../lib/hooks/useLanguage";
import { testsApi } from "../../../../lib/api/tests";
import type { SessionResult, SuggestedAction } from "../../../../lib/api/tests";
import { useThemeColors, radius } from "../../../../lib/theme";
import { shadow } from "../../../../lib/theme/shadows";

const ACTION_ICON: Record<SuggestedAction["type"], keyof typeof Ionicons.glyphMap> = {
  exercise: "leaf",
  journal: "book",
  chat: "chatbubble",
  hotline: "call",
};

function deeplinkToRoute(deeplink: string): string {
  if (deeplink.startsWith("/exercises")) return "/(tabs)/exercises";
  if (deeplink.startsWith("/journal")) return "/(tabs)/journal";
  if (deeplink.startsWith("/chat")) return "/(tabs)/chat";
  return "/";
}

export default function CompletionScreen() {
  const t = useT();
  const c = useThemeColors();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { replace, push } = useRouter();

  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useQuery<SessionResult>({
    queryKey: ["test", "completion", sessionId],
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

  const isSoft = result.requiresSupport;
  const title = isSoft ? t.completion.titleSoft : t.completion.titleNormal;
  const subtitle = isSoft ? t.completion.subtitleSoft : t.completion.subtitleNormal;
  const cardBg = isSoft ? "#FFF7ED" : "#F0FDF4";
  const cardBorder = isSoft ? "#FED7AA" : "#BBF7D0";
  const emoji = isSoft ? "\u{1F917}" : "\u{1F331}";

  const actionLabel = (type: SuggestedAction["type"]) => {
    switch (type) {
      case "exercise":
        return t.completion.actionBreathing;
      case "journal":
        return t.completion.actionJournal;
      case "chat":
        return t.completion.actionChatPsychologist;
      case "hotline":
        return t.completion.actionHotline;
    }
  };

  const onAction = (action: SuggestedAction) => {
    if (action.deeplink.startsWith("tel:")) {
      Linking.openURL(action.deeplink).catch(() => {});
      return;
    }
    push(deeplinkToRoute(action.deeplink) as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
      <View style={styles.content}>
        <View style={[styles.resultCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text variant="h1" style={[styles.resultTitle, { color: c.text }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: c.textLight }]}>{subtitle}</Text>
        </View>

        <View style={styles.actions}>
          {result.suggestedActions.map((action) => {
            const icon = ACTION_ICON[action.type];
            const isPrimary = isSoft && (action.type === "chat" || action.type === "hotline");
            return (
              <Pressable
                key={`${action.type}-${action.deeplink}`}
                onPress={() => onAction(action)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  isPrimary
                    ? { backgroundColor: c.primary }
                    : { backgroundColor: c.surface },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={18}
                  color={isPrimary ? "#FFFFFF" : c.text}
                />
                <Text
                  style={[
                    styles.actionText,
                    { color: isPrimary ? "#FFFFFF" : c.text },
                  ]}
                >
                  {actionLabel(action.type)}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => replace("/")}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: c.surface },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="home" size={18} color={c.text} />
            <Text style={[styles.actionText, { color: c.text }]}>
              {t.completion.backHome}
            </Text>
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
  resultTitle: { marginTop: 12, textAlign: "center" },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  actions: { width: "100%", maxWidth: 360, marginTop: 24, gap: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 14,
    ...shadow(1),
  },
  actionText: { fontSize: 14, fontWeight: "700" },
});
