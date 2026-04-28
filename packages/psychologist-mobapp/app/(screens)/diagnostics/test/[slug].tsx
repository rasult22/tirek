import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { testDefinitions } from "@tirek/shared";
import { Text } from "../../../../components/ui";
import { useT, useLanguage } from "../../../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../../../lib/theme";
import { hapticLight } from "../../../../lib/haptics";

export default function TestDetailScreen() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

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
    router.push(
      `/(screens)/diagnostics/assign?testSlug=${td.slug}&target=${target}` as any,
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen options={{ title: t.psychologist.diagnostics }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="h2" style={{ fontFamily: "DMSans-Bold" }}>
          {name}
        </Text>
        <Text variant="body" style={{ marginTop: 6 }}>
          {description}
        </Text>

        <View style={styles.metaRow}>
          {td.durationMinutes != null && (
            <View
              style={[
                styles.metaPill,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Ionicons name="time-outline" size={12} color={c.textLight} />
              <Text variant="caption">
                {t.psychologist.testDurationMinutes.replace(
                  "{n}",
                  String(td.durationMinutes),
                )}
              </Text>
            </View>
          )}
          {td.ageRange && (
            <View
              style={[
                styles.metaPill,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Ionicons name="school-outline" size={12} color={c.textLight} />
              <Text variant="caption">
                {t.psychologist.testAgeRangeGrades
                  .replace("{from}", String(td.ageRange.minGrade))
                  .replace("{to}", String(td.ageRange.maxGrade))}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.metaPill,
              { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Text variant="caption">
              {td.questions.length}{" "}
              {language === "kz" ? "сұрақ" : "вопр."}
            </Text>
          </View>
        </View>

        {tips && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={16} color="#B45309" />
              <Text
                variant="body"
                style={{
                  fontFamily: "DMSans-Bold",
                  color: "#92400E",
                }}
              >
                {t.psychologist.testWhenToAssign}
              </Text>
            </View>
            <Text
              variant="body"
              style={{ color: "#92400E", marginTop: 6, lineHeight: 20 }}
            >
              {tips}
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: c.bg, borderTopColor: c.borderLight },
        ]}
      >
        <Pressable
          onPress={() => goAssign("student")}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: c.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            variant="body"
            style={{ color: "#FFF", fontFamily: "DMSans-SemiBold" }}
          >
            {t.psychologist.assignToStudentBtn}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => goAssign("class")}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: c.primary, backgroundColor: c.surface },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            variant="body"
            style={{ color: c.primary, fontFamily: "DMSans-SemiBold" }}
          >
            {t.psychologist.assignToClassBtn}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tipsCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
