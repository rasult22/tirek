import { useState, useCallback } from "react";
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../components/ui";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { testDefinitions } from "@tirek/shared";
import { useThemeColors, radius, spacing } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";

const TEST_ICONS: Record<string, { bg: string; emoji: string }> = {
  "phq-a": { bg: "#DBEAFE", emoji: "\u{1F49C}" },
  "gad-7": { bg: "#CCFBF1", emoji: "\u{1F9E1}" },
  rosenberg: { bg: "#D1FAE5", emoji: "\u{1F49A}" },
  scared: { bg: "#FEF3C7", emoji: "\u{1F630}" },
  stai: { bg: "#E0F2FE", emoji: "\u{1F30A}" },
  "pss-10": { bg: "#FEE2E2", emoji: "\u{1F525}" },
  bullying: { bg: "#FFEDD5", emoji: "\u{1F6E1}\u{FE0F}" },
  "academic-burnout": { bg: "#FEF9C3", emoji: "\u{1F4DA}" },
  sociometry: { bg: "#CFFAFE", emoji: "\u{1F91D}" },
  "eysenck-self-esteem": { bg: "#EDE9FE", emoji: "\u{1FA9E}" },
  "andreeva-learning": { bg: "#ECFCCB", emoji: "\u{1F4D6}" },
  "bullying-violence": { bg: "#FFE4E6", emoji: "\u{26A0}\u{FE0F}" },
  "buss-darky": { bg: "#FEE2E2", emoji: "\u{1F4A2}" },
  "beck-depression": { bg: "#E0E7FF", emoji: "\u{1F327}\u{FE0F}" },
  "phillips-anxiety": { bg: "#F3E8FF", emoji: "\u{1F3EB}" },
  "olweus-bullying": { bg: "#FEF3C7", emoji: "\u{1F6A8}" },
};

export default function TestsListScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const router = useRouter();

  const tests = Object.values(testDefinitions);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Static data — nothing to refetch
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: t.tests.title }} />
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
        {tests.map((test) => {
          const meta = TEST_ICONS[test.slug] ?? {
            bg: "#F3F4F6",
            emoji: "\u{1F4CB}",
          };
          const name = language === "kz" ? test.nameKz : test.nameRu;
          const desc =
            language === "kz" ? test.descriptionKz : test.descriptionRu;

          return (
            <Pressable
              key={test.slug}
              onPress={() =>
                router.push({
                  pathname: "/(screens)/tests/[testId]",
                  params: { testId: test.slug },
                })
              }
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: c.surface,
                  borderColor: c.borderLight,
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View
                style={[styles.iconWrap, { backgroundColor: meta.bg }]}
              >
                <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: c.text }]}>{name}</Text>
                <Text numberOfLines={2} style={[styles.cardDesc, { color: c.textLight }]}>
                  {desc}
                </Text>
                <Text style={[styles.cardQuestions, { color: c.primaryDark }]}>
                  {test.questions.length} {t.tests.question.toLowerCase()}
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
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 12 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    ...shadow(1),
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "700" },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  cardQuestions: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },
});
