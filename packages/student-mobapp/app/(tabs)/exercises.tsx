import {
  View,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { exercisesApi } from "../../lib/api/exercises";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { SkeletonList } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";

const EMOJI_MAP: Record<string, { emoji: string; bg: string }> = {
  "square-breathing": { emoji: "\u2B1B", bg: "rgba(59,130,246,0.12)" },
  "breathing-478": { emoji: "\uD83C\uDF00", bg: "rgba(20,184,166,0.12)" },
  diaphragmatic: { emoji: "\uD83C\uDF88", bg: "rgba(16,185,129,0.12)" },
  "grounding-54321": { emoji: "\uD83C\uDF3F", bg: "rgba(34,197,94,0.12)" },
  pmr: { emoji: "\uD83D\uDCAA", bg: "rgba(245,158,11,0.12)" },
  "thought-diary": { emoji: "\uD83D\uDCD3", bg: "rgba(139,92,246,0.12)" },
};

const SLUG_TO_ROUTE: Record<string, string> = {
  "square-breathing": "/(screens)/exercises/breathing",
  "breathing-478": "/(screens)/exercises/breathing",
  diaphragmatic: "/(screens)/exercises/breathing",
  "grounding-54321": "/(screens)/exercises/grounding",
  pmr: "/(screens)/exercises/pmr",
  "thought-diary": "/(screens)/exercises/thought-diary",
};

function ExerciseItem({
  item,
  language,
  push,
  c,
}: {
  item: any;
  language: string;
  push: ReturnType<typeof useRouter>["push"];
  c: ReturnType<typeof useThemeColors>;
}) {
  const visual = EMOJI_MAP[item.slug] ?? { emoji: "\uD83C\uDF3F", bg: "rgba(107,114,128,0.1)" };
  const name = language === "kz" && item.nameKz ? item.nameKz : item.nameRu;
  const route = SLUG_TO_ROUTE[item.slug];

  return (
    <Pressable
      onPress={() => {
        if (route) {
          push({
            pathname: route as any,
            params: { slug: item.slug, exerciseId: item.id },
          });
        }
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.borderLight,
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.cardIcon, { backgroundColor: visual.bg }]}>
        <Text style={styles.cardEmoji}>{visual.emoji}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardName, { color: c.text }]}>{name}</Text>
        <Text style={[styles.cardDesc, { color: c.textLight }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textLight} />
    </Pressable>
  );
}

export default function ExercisesScreen() {
  const t = useT();
  const { language } = useLanguage();
  const { push } = useRouter();
  const c = useThemeColors();

  const { data: exercises, isLoading, isError, refetch } = useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesApi.list,
  });

  const { refreshing, onRefresh } = useRefresh(refetch);

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <View style={styles.scroll}>
          <Text style={[styles.title, { color: c.text }]}>{t.exercises.title}</Text>
          <SkeletonList count={5} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <FlashList
        data={exercises ?? []}
        renderItem={({ item }) => (
          <ExerciseItem item={item} language={language} push={push} c={c} />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <Text style={[styles.title, { color: c.text }]}>{t.exercises.title}</Text>
            <View style={styles.heroWrap}>
              <View style={styles.heroIcon}>
                <Ionicons name="leaf" size={48} color={c.primary} />
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="leaf-outline"
            title={t.exercises.emptyTitle}
            description={t.exercises.emptyDescription}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  heroWrap: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(15,118,110,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
    ...shadow(1),
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
