import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { testDefinitions } from "@tirek/shared";
import { Text } from "../ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Map test slug → category icon. Falls back to a generic clipboard icon.
 * Icons are picked by category meaning rather than per-test branding so
 * new test slugs work out of the box.
 */
function iconForSlug(slug: string): IconName {
  if (slug.startsWith("phq")) return "sad-outline"; // depression
  if (slug.startsWith("gad")) return "pulse-outline"; // anxiety
  if (slug.startsWith("scared")) return "shield-half-outline"; // anxiety (kids)
  if (slug.startsWith("rcads")) return "happy-outline"; // anxiety/depression
  if (slug.startsWith("sdq")) return "people-outline"; // strengths/diff
  return "clipboard-outline";
}

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
        const questionCount = (td as { questions?: ReadonlyArray<unknown> })
          .questions?.length;
        const icon = iconForSlug(td.slug);

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
            <View
              style={[styles.iconWrap, { backgroundColor: c.surfaceSecondary }]}
            >
              <Ionicons name={icon} size={20} color={c.primary} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 16,
                  lineHeight: 22,
                  fontFamily: "Inter_600SemiBold",
                  color: c.text,
                }}
                numberOfLines={2}
              >
                {name}
              </Text>
              {description ? (
                <Text variant="caption" numberOfLines={2} style={styles.desc}>
                  {description}
                </Text>
              ) : null}

              <View style={styles.chipsRow}>
                {duration != null && (
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: c.surfaceSecondary },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={c.textLight}
                    />
                    <Text style={[styles.chipText, { color: c.textLight }]}>
                      {t.psychologist.testDurationMinutes.replace(
                        "{n}",
                        String(duration),
                      )}
                    </Text>
                  </View>
                )}
                {age && (
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: c.surfaceSecondary },
                    ]}
                  >
                    <Ionicons
                      name="school-outline"
                      size={11}
                      color={c.textLight}
                    />
                    <Text style={[styles.chipText, { color: c.textLight }]}>
                      {t.psychologist.testAgeRangeGrades
                        .replace("{from}", String(age.minGrade))
                        .replace("{to}", String(age.maxGrade))}
                    </Text>
                  </View>
                )}
                {questionCount != null && (
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: c.surfaceSecondary },
                    ]}
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={11}
                      color={c.textLight}
                    />
                    <Text style={[styles.chipText, { color: c.textLight }]}>
                      {questionCount}{" "}
                      {language === "kz" ? "сұрақ" : "вопр."}
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
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  desc: {
    marginTop: 2,
  },
  chipsRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_500Medium",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
});
