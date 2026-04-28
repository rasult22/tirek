import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { testDefinitions } from "@tirek/shared";
import { Text } from "../ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";

export function CatalogSegment() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const router = useRouter();

  const tests = Object.values(testDefinitions);

  if (tests.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyLight">{t.psychologist.testCatalogEmpty}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {tests.map((td) => {
        const name = language === "kz" ? td.nameKz : td.nameRu;
        const description =
          language === "kz" ? td.descriptionKz : td.descriptionRu;
        const duration = (td as { durationMinutes?: number }).durationMinutes;
        const age = (td as {
          ageRange?: { minGrade: number; maxGrade: number };
        }).ageRange;

        return (
          <Pressable
            key={td.slug}
            onPress={() => {
              hapticLight();
              router.push(`/(screens)/diagnostics/test/${td.slug}` as any);
            }}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: c.surface, borderColor: c.borderLight },
              shadow(1),
              pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="body" style={styles.title} numberOfLines={2}>
                {name}
              </Text>
              <Text variant="caption" numberOfLines={2} style={styles.desc}>
                {description}
              </Text>
              <View style={styles.metaRow}>
                {duration != null && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={c.textLight}
                    />
                    <Text variant="caption">
                      {t.psychologist.testDurationMinutes.replace(
                        "{n}",
                        String(duration),
                      )}
                    </Text>
                  </View>
                )}
                {age && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="school-outline"
                      size={11}
                      color={c.textLight}
                    />
                    <Text variant="caption">
                      {t.psychologist.testAgeRangeGrades
                        .replace("{from}", String(age.minGrade))
                        .replace("{to}", String(age.maxGrade))}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={`${c.textLight}80`}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  title: {
    fontFamily: "DMSans-SemiBold",
  },
  desc: {
    marginTop: 2,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
});
