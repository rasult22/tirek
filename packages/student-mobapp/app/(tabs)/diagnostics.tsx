import {
  View,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { testsApi } from "../../lib/api/tests";
import { useThemeColors } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";
import type { AssignedTest } from "@tirek/shared";

const dueDateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

function formatDueDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return dueDateFormatter.format(new Date(dateStr));
}

function TestCardItem({
  item,
  language,
  c,
  t,
  onPress,
}: {
  item: AssignedTest;
  language: string;
  c: ReturnType<typeof useThemeColors>;
  t: any;
  onPress: (a: AssignedTest) => void;
}) {
  const isCompleted = item.status === "completed";
  const borderLeftColor = item.overdue
    ? "#EF4444"
    : isCompleted
      ? "#10B981"
      : c.borderLight;

  const ctaLabel = isCompleted
    ? t.tests.ctaViewResult
    : item.status === "in_progress"
      ? t.tests.ctaResume
      : t.tests.ctaStart;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.surface,
          borderLeftColor,
          borderColor: c.borderLight,
        },
        isCompleted && styles.cardCompleted,
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>
          {item.test.emoji ?? "\u{1F4DD}"}
        </Text>
        <View style={styles.cardTitleWrap}>
          <Text
            style={[styles.cardTitle, { color: c.text }]}
            numberOfLines={1}
          >
            {language === "kz" && item.test.nameKz
              ? item.test.nameKz
              : item.test.nameRu ?? item.test.slug}
          </Text>
          <StatusBadge assignment={item} />
        </View>
      </View>
      {item.test.description && !isCompleted ? (
        <Text
          style={[styles.cardDesc, { color: c.textLight }]}
          numberOfLines={2}
        >
          {item.test.description}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        {item.dueDate && !isCompleted ? (
          <Text
            style={[
              styles.dueDate,
              {
                color: item.overdue ? "#EF4444" : c.textLight,
                fontWeight: item.overdue ? "700" : "400",
              },
            ]}
          >
            {t.tests.dueDate}: {formatDueDate(item.dueDate)}
          </Text>
        ) : null}
        <Text style={[styles.ctaLabel, { color: c.primary }]}>
          {ctaLabel}
        </Text>
      </View>
    </Pressable>
  );
}

interface Section {
  title: string;
  data: AssignedTest[];
}

export default function DiagnosticsTabScreen() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const { push } = useRouter();
  const queryClient = useQueryClient();

  const { data: assigned, isLoading, isError, refetch } = useQuery({
    queryKey: ["tests", "assigned"],
    queryFn: testsApi.assigned,
    refetchInterval: 60_000,
  });

  function handlePress(a: AssignedTest) {
    hapticLight();
    if (a.status === "completed" && a.completedSessionId) {
      push(`/(screens)/tests/results/${a.completedSessionId}` as any);
    } else {
      push({
        pathname: "/(screens)/tests/[testId]" as any,
        params: { testId: a.test.slug },
      });
    }
  }

  const { refreshing, onRefresh } = useRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ["tests", "assigned"] });
  });

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <View style={styles.header}>
          <Text variant="h2">{t.tests.title}</Text>
        </View>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <View style={styles.header}>
          <Text variant="h2">{t.tests.title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <SkeletonList count={5} />
        </View>
      </SafeAreaView>
    );
  }

  const tests = assigned ?? [];
  const active = tests.filter((a) => a.status !== "completed");
  const completed = tests.filter((a) => a.status === "completed");

  const sections: Section[] = [];
  if (active.length > 0) {
    sections.push({ title: t.tests.activeSection, data: active });
  }
  if (completed.length > 0) {
    sections.push({ title: t.tests.completedSection, data: completed });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text variant="h2">{t.tests.title}</Text>
      </View>
      {tests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: `${c.primary}15` }]}>
            <Ionicons name="clipboard-outline" size={40} color={c.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>
            {t.tests.emptyTitle}
          </Text>
          <Text style={[styles.emptyDesc, { color: c.textLight }]}>
            {t.tests.emptyDesc}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.assignmentId}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: c.bg }]}>
              <Text style={[styles.sectionTitle, { color: c.textLight }]}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TestCardItem
              item={item}
              language={language}
              c={c}
              t={t}
              onPress={handlePress}
            />
          )}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    paddingHorizontal: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 10,
    ...shadow(1),
  },
  cardCompleted: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 4,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  dueDate: {
    fontSize: 11,
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
