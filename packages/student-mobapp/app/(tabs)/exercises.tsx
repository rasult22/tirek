import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { exercisesApi } from "../../lib/api/exercises";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { SkeletonList } from "../../components/Skeleton";

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

export default function ExercisesScreen() {
  const t = useT();
  const { language } = useLanguage();
  const router = useRouter();
  const c = useThemeColors();

  const { data: exercises, isLoading, isError, refetch } = useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesApi.list,
  });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* Header */}
        <Text style={[styles.title, { color: c.text }]}>{t.exercises.title}</Text>

        {/* Hero icon */}
        <View style={styles.heroWrap}>
          <View style={styles.heroIcon}>
            <Ionicons name="leaf" size={48} color={c.primary} />
          </View>
        </View>

        {/* Exercise cards */}
        {isLoading && <SkeletonList count={5} />}

        {exercises?.map((ex) => {
          const visual = EMOJI_MAP[ex.slug] ?? { emoji: "\uD83C\uDF3F", bg: "rgba(107,114,128,0.1)" };
          const name = language === "kz" && ex.nameKz ? ex.nameKz : ex.nameRu;
          const route = SLUG_TO_ROUTE[ex.slug];

          return (
            <Pressable
              key={ex.id}
              onPress={() => {
                if (route) {
                  router.push({
                    pathname: route as any,
                    params: { slug: ex.slug, exerciseId: ex.id },
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
                  {ex.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={c.textLight}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
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
