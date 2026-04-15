import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { contentApi } from "../../lib/api/content";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { SkeletonList } from "../../components/Skeleton";
import type { ContentQuote } from "@tirek/shared";

type Category = "all" | "motivation" | "proverb" | "affirmation" | "story";

const CATEGORY_ICONS: Record<Category, string> = {
  all: "sparkles",
  motivation: "rocket-outline",
  proverb: "book-outline",
  affirmation: "heart-outline",
  story: "reader-outline",
};

const CATEGORY_COLORS: Record<Category, string> = {
  all: "#6C5CE7",
  motivation: "#00B894",
  proverb: "#F59E0B",
  affirmation: "#EC4899",
  story: "#3B82F6",
};

export default function InspirationScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const queryParam = activeCategory === "all" ? undefined : activeCategory;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["quotes", activeCategory],
    queryFn: () => contentApi.quotes(queryParam),
  });

  const { refreshing, onRefresh } = useRefresh(refetch);

  const quotes = data?.data ?? [];

  const categories: Category[] = [
    "all",
    "motivation",
    "proverb",
    "affirmation",
    "story",
  ];

  const categoryLabels: Record<Category, string> = {
    all: t.quotes.allCategories,
    motivation: t.quotes.categories.motivation,
    proverb: t.quotes.categories.proverb,
    affirmation: t.quotes.categories.affirmation,
    story: t.quotes.categories.story,
  };

  const renderQuoteCard = ({ item }: { item: ContentQuote }) => {
    const text =
      language === "kz" && item.textKz ? item.textKz : item.textRu;
    const color = CATEGORY_COLORS[item.category as Category] ?? c.primary;
    const isStory = item.category === "story";

    return (
      <View
        style={[
          styles.quoteCard,
          { backgroundColor: c.surface, borderColor: c.borderLight },
        ]}
      >
        {/* Category badge */}
        <View style={styles.cardHeader}>
          <View
            style={[styles.categoryBadge, { backgroundColor: color + "20" }]}
          >
            <Ionicons
              name={
                (CATEGORY_ICONS[item.category as Category] as any) ??
                "sparkles"
              }
              size={12}
              color={color}
            />
            <Text style={[styles.categoryBadgeText, { color }]}>
              {categoryLabels[item.category as Category] ?? item.category}
            </Text>
          </View>
        </View>

        {/* Text content */}
        <Text
          style={[
            isStory ? styles.storyText : styles.quoteText,
            { color: c.text },
          ]}
        >
          {isStory ? text : `\u00AB${text}\u00BB`}
        </Text>

        {/* Author if any */}
        {item.author && (
          <Text style={[styles.authorText, { color: c.textLight }]}>
            — {item.author}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: t.inspiration.title }} />

      {/* Subtitle */}
      <View style={styles.subtitleWrap}>
        <Ionicons name="sparkles" size={16} color={c.primary} />
        <Text style={[styles.subtitle, { color: c.textLight }]}>
          {t.inspiration.subtitle}
        </Text>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const color = CATEGORY_COLORS[cat];
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: c.surface, borderColor: c.borderLight },
              ]}
            >
              <Ionicons
                name={CATEGORY_ICONS[cat] as any}
                size={14}
                color={isActive ? "#FFFFFF" : c.textLight}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? "#FFFFFF" : c.text },
                ]}
              >
                {categoryLabels[cat]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content list */}
      <View style={styles.listWrap}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlashList
          data={quotes}
          renderItem={renderQuoteCard}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={[styles.emptyText, { color: c.textLight }]}>
                {t.inspiration.emptyCategory}
              </Text>
            </View>
          }
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  subtitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  subtitle: { fontSize: 13, flex: 1 },

  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  listWrap: { flex: 1 },
  loadingWrap: { paddingHorizontal: 20, marginTop: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  quoteCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },

  quoteText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    fontFamily: "Nunito-Regular",
  },
  storyText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Nunito-Regular",
  },
  authorText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "600",
  },

  emptyState: { alignItems: "center", marginTop: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: "center" },
});
