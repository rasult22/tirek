import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { sosApi } from "../../lib/api/sos";
import { hotlines } from "@tirek/shared";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";

export default function SOSScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const { push } = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);

  const sosMutation = useMutation({
    mutationFn: (level: 1 | 2 | 3) => sosApi.trigger(level),
  });

  const LEVELS = [
    {
      level: 1 as const,
      borderActive: "#FACC15",
      bgActive: "#FEFCE8",
      iconBg: "rgba(250,204,21,0.2)",
      iconColor: "#CA8A04",
      badgeBg: "#FACC15",
    },
    {
      level: 2 as const,
      borderActive: c.warning,
      bgActive: "#FFF7ED",
      iconBg: "rgba(140,99,8,0.2)",
      iconColor: c.warning,
      badgeBg: c.warning,
    },
    {
      level: 3 as const,
      borderActive: c.danger,
      bgActive: "#FEF2F2",
      iconBg: "rgba(179,59,59,0.2)",
      iconColor: c.danger,
      badgeBg: c.danger,
    },
  ];

  const levelLabels: Record<1 | 2 | 3, { name: string; desc: string }> = {
    1: { name: t.sos.level1, desc: t.sos.level1Desc },
    2: { name: t.sos.level2, desc: t.sos.level2Desc },
    3: { name: t.sos.level3, desc: t.sos.level3Desc },
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen
        options={{
          title: t.sos.title,
          headerTintColor: c.danger,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Calming message */}
        <View style={styles.calmCard}>
          <View style={styles.heartWrap}>
            <Ionicons name="heart" size={32} color={c.danger} />
          </View>
          <Text style={[styles.calmText, { color: c.text }]}>{t.sos.message}</Text>
        </View>

        {/* Breathing shortcut */}
        <Pressable
          onPress={() => push("/(screens)/exercises/breathing")}
          style={({ pressed }) => [
            styles.breatheCard,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.breatheIcon}>
            <Ionicons name="leaf" size={24} color={c.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.breatheTitle, { color: c.text }]}>{t.sos.breathe}</Text>
            <Text style={[styles.breatheDesc, { color: c.textLight }]}>
              {t.exercises.squareBreathingDesc}
            </Text>
          </View>
        </Pressable>

        {/* Level selection */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t.sos.selectLevel}</Text>
        <View style={styles.levelList}>
          {LEVELS.map((l) => {
            const info = levelLabels[l.level];
            const selected = selectedLevel === l.level;
            return (
              <Pressable
                key={l.level}
                onPress={() => setSelectedLevel(l.level)}
                style={[
                  styles.levelCard,
                  {
                    borderColor: c.borderLight,
                    backgroundColor: c.surface,
                  },
                  selected && {
                    borderColor: l.borderActive,
                    backgroundColor: l.bgActive,
                  },
                ]}
              >
                <View
                  style={[
                    styles.levelIcon,
                    selected
                      ? { backgroundColor: l.iconBg }
                      : { backgroundColor: c.surfaceSecondary },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={selected ? l.iconColor : c.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.levelHeader}>
                    <View
                      style={[styles.levelBadge, { backgroundColor: l.badgeBg }]}
                    >
                      <Text style={styles.levelBadgeText}>{l.level}</Text>
                    </View>
                    <Text style={[styles.levelName, { color: c.text }]}>{info.name}</Text>
                  </View>
                  <Text style={[styles.levelDesc, { color: c.textLight }]}>{info.desc}</Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark" size={20} color={c.text} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Level 3 warning */}
        {selectedLevel === 3 && (
          <View style={styles.warningBox}>
            <Text style={[styles.warningText, { color: c.danger }]}>
              {t.sos.confidentialityNote}
            </Text>
          </View>
        )}

        {/* Send SOS button */}
        <Pressable
          onPress={() => selectedLevel && sosMutation.mutate(selectedLevel)}
          disabled={!selectedLevel || sosMutation.isPending}
          style={({ pressed }) => [
            styles.sosBtn,
            { backgroundColor: c.danger },
            (!selectedLevel || sosMutation.isPending) && { opacity: 0.5 },
            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
          <Text style={styles.sosBtnText}>
            {sosMutation.isSuccess ? t.sos.sent : t.sos.callPsychologist}
          </Text>
        </Pressable>

        {/* Hotlines */}
        <View style={styles.hotlinesSection}>
          <View style={styles.hotlinesHeader}>
            <Ionicons name="shield" size={16} color={c.danger} />
            <Text style={[styles.hotlinesTitle, { color: c.text }]}>{t.sos.hotlines}</Text>
          </View>
          {hotlines.map((h) => (
            <Pressable
              key={h.number}
              onPress={() => Linking.openURL(`tel:${h.number}`)}
              style={({ pressed }) => [
                styles.hotlineCard,
                { backgroundColor: c.surface },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.hotlineIcon}>
                <Ionicons name="call" size={20} color={c.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hotlineNumber, { color: c.danger }]}>{h.number}</Text>
                <Text style={[styles.hotlineLabel, { color: c.textLight }]}>
                  {language === "kz" ? h.labelKz : h.labelRu}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Confidentiality note */}
        <View style={[styles.confidentialityNote, { backgroundColor: c.surfaceSecondary }]}>
          <Text style={[styles.confidentialityText, { color: c.textLight }]}>
            {t.sos.confidentialityNote}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  calmCard: {
    marginTop: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: "rgba(179,59,59,0.2)",
    backgroundColor: "#FEF2F2",
    padding: 24,
    alignItems: "center",
  },
  heartWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(179,59,59,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  calmText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
  },

  breatheCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
    backgroundColor: "rgba(45,109,140,0.15)",
    borderRadius: radius.lg,
    padding: 20,
  },
  breatheIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(45,109,140,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  breatheTitle: { fontSize: 14, fontWeight: "700" },
  breatheDesc: {
    fontSize: 12,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },

  levelList: { gap: 12 },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: 16,
  },
  levelIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  levelName: { fontSize: 14, fontWeight: "700" },
  levelDesc: { fontSize: 12, marginTop: 2 },

  warningBox: {
    marginTop: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(179,59,59,0.3)",
    backgroundColor: "#FEF2F2",
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  sosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow(2),
  },
  sosBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  hotlinesSection: { marginTop: 24 },
  hotlinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  hotlinesTitle: { fontSize: 14, fontWeight: "700" },
  hotlineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow(1),
  },
  hotlineIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(179,59,59,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  hotlineNumber: {
    fontSize: 18,
    fontWeight: "800",
  },
  hotlineLabel: { fontSize: 12, marginTop: 2 },

  confidentialityNote: {
    marginTop: 16,
    borderRadius: radius.md,
    padding: 16,
  },
  confidentialityText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
