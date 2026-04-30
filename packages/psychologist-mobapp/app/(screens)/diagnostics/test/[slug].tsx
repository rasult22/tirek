import { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { testDefinitions } from "@tirek/shared";
import { Text, Button, HelpSheet } from "../../../../components/ui";
import { useT, useLanguage } from "../../../../lib/hooks/useLanguage";
import { useThemeColors, radius, spacing } from "../../../../lib/theme";
import { hapticLight } from "../../../../lib/haptics";
import { colors as ds } from "@tirek/shared/design-system";

type IconName = keyof typeof Ionicons.glyphMap;

function iconForSlug(slug: string): IconName {
  if (slug.startsWith("phq")) return "sad-outline";
  if (slug.startsWith("gad")) return "pulse-outline";
  if (slug.startsWith("scared")) return "shield-half-outline";
  if (slug.startsWith("rcads")) return "happy-outline";
  if (slug.startsWith("sdq")) return "people-outline";
  return "clipboard-outline";
}

export default function TestDetailScreen() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [helpOpen, setHelpOpen] = useState(false);

  if (!slug || !(slug in testDefinitions)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: "—" }} />
        <View style={styles.empty}>
          <Text variant="bodyLight">{t.common.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const td = testDefinitions[slug as keyof typeof testDefinitions] as unknown as {
    slug: string;
    nameRu: string;
    nameKz: string;
    descriptionRu: string;
    descriptionKz: string;
    questions: ReadonlyArray<{ index: number }>;
    durationMinutes?: number;
    ageRange?: { minGrade: number; maxGrade: number };
    tipsRu?: string;
    tipsKz?: string;
  };
  const name = language === "kz" ? td.nameKz : td.nameRu;
  const description = language === "kz" ? td.descriptionKz : td.descriptionRu;
  const tips = language === "kz" ? td.tipsKz : td.tipsRu;

  function goAssign(target: "student" | "class") {
    hapticLight();
    const path =
      target === "student"
        ? "/(screens)/diagnostics/assign-student"
        : "/(screens)/diagnostics/assign-class";
    router.push(`${path}?testSlug=${td.slug}` as any);
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen options={{ title: t.psychologist.diagnostics }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero — brand-tinted */}
        <View
          style={[
            styles.hero,
            { backgroundColor: ds.brandSoft, borderColor: `${c.primary}1A` },
          ]}
        >
          <View style={styles.heroRow}>
            <View
              style={[styles.heroIcon, { backgroundColor: c.surface }]}
            >
              <Ionicons
                name={iconForSlug(td.slug)}
                size={22}
                color={c.primaryDark}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 20,
                  lineHeight: 26,
                  fontFamily: "Inter_700Bold",
                  color: c.text,
                }}
              >
                {name}
              </Text>
              <Text
                variant="bodyLight"
                style={{ marginTop: 4, lineHeight: 20 }}
              >
                {description}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {td.durationMinutes != null && (
              <View
                style={[styles.metaPill, { backgroundColor: c.surface }]}
              >
                <Ionicons name="time-outline" size={11} color={c.textLight} />
                <Text style={[styles.metaPillText, { color: c.textLight }]}>
                  {t.psychologist.testDurationMinutes.replace(
                    "{n}",
                    String(td.durationMinutes),
                  )}
                </Text>
              </View>
            )}
            {td.ageRange && (
              <View
                style={[styles.metaPill, { backgroundColor: c.surface }]}
              >
                <Ionicons name="school-outline" size={11} color={c.textLight} />
                <Text style={[styles.metaPillText, { color: c.textLight }]}>
                  {t.psychologist.testAgeRangeGrades
                    .replace("{from}", String(td.ageRange.minGrade))
                    .replace("{to}", String(td.ageRange.maxGrade))}
                </Text>
              </View>
            )}
            <View style={[styles.metaPill, { backgroundColor: c.surface }]}>
              <Ionicons
                name="help-circle-outline"
                size={11}
                color={c.textLight}
              />
              <Text style={[styles.metaPillText, { color: c.textLight }]}>
                {td.questions.length}{" "}
                {language === "kz" ? "сұрақ" : "вопр."}
              </Text>
            </View>
          </View>
        </View>

        {/* Inline CTAs — primary fill + outlined secondary */}
        <View style={styles.ctaCol}>
          <Button
            title={t.psychologist.assignToStudentBtn}
            variant="primary"
            size="md"
            onPress={() => goAssign("student")}
          />
          <Pressable
            onPress={() => goAssign("class")}
            style={({ pressed }) => [
              styles.outlineBtn,
              { borderColor: c.primary, backgroundColor: "transparent" },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 15,
                color: c.primary,
              }}
            >
              {t.psychologist.assignToClassBtn}
            </Text>
          </Pressable>
        </View>

        {/* When-to-assign tip — single-row trigger that opens HelpSheet */}
        {tips && (
          <Pressable
            onPress={() => {
              hapticLight();
              setHelpOpen(true);
            }}
            style={({ pressed }) => [
              styles.tipsTrigger,
              {
                backgroundColor: c.surface,
                borderColor: c.borderLight,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="bulb-outline" size={16} color={c.warning} />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 13,
                color: c.text,
                flex: 1,
              }}
            >
              {t.psychologist.testWhenToAssign}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={c.textLight}
            />
          </Pressable>
        )}
      </ScrollView>

      {tips && (
        <HelpSheet
          visible={helpOpen}
          title={t.psychologist.testWhenToAssign}
          description={tips}
          onClose={() => setHelpOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
    gap: spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_500Medium",
  },
  ctaCol: {
    gap: spacing.sm,
  },
  outlineBtn: {
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  tipsTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
