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
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { sosApi } from "../../lib/api/sos";
import { hotlines, type SOSAction } from "@tirek/shared";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";

type Step = "menu" | "urgent-sent";

export default function SOSScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const { push, back } = useRouter();
  const [step, setStep] = useState<Step>("menu");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sosMutation = useMutation({
    mutationFn: (action: SOSAction) => sosApi.trigger(action),
  });

  function pickAction(action: SOSAction) {
    if (action === "breathing") {
      push("/(screens)/exercises/breathing");
      return;
    }
    if (action === "chat") {
      sosMutation.mutate("chat");
      push("/(screens)/messages");
      return;
    }
    if (action === "hotline") {
      sosMutation.mutate("hotline");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmUrgent() {
    setConfirmOpen(false);
    try {
      await sosMutation.mutateAsync("urgent");
      setStep("urgent-sent");
    } catch {
      // network errors surface via mutation state on retry; UI stays on menu.
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen
        options={{ title: t.sos.title, headerTintColor: c.danger }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {step === "menu" ? (
          <>
            <View style={styles.calmCard}>
              <View style={styles.heartWrap}>
                <Ionicons name="heart" size={32} color={c.danger} />
              </View>
              <Text style={[styles.calmText, { color: c.text }]}>
                {t.sos.message}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: c.text }]}>
              {t.sos.selectLevel}
            </Text>

            <View style={styles.actionList}>
              <ActionCard
                iconName="leaf"
                iconBg="rgba(45,109,140,0.3)"
                iconColor={c.secondary}
                title={t.sos.actions.breathing}
                desc={t.sos.actions.breathingDesc}
                surface={c.surface}
                textColor={c.text}
                descColor={c.textLight}
                borderColor={c.borderLight}
                onPress={() => pickAction("breathing")}
              />
              <ActionCard
                iconName="call"
                iconBg="rgba(34,197,94,0.2)"
                iconColor={c.success}
                title={t.sos.actions.hotline}
                desc={t.sos.actions.hotlineDesc}
                surface={c.surface}
                textColor={c.text}
                descColor={c.textLight}
                borderColor={c.borderLight}
                onPress={() => pickAction("hotline")}
              />
              <ActionCard
                iconName="chatbubble-ellipses"
                iconBg="rgba(45,109,140,0.2)"
                iconColor={c.primary}
                title={t.sos.actions.chat}
                desc={t.sos.actions.chatDesc}
                surface={c.surface}
                textColor={c.text}
                descColor={c.textLight}
                borderColor={c.borderLight}
                onPress={() => pickAction("chat")}
              />
              <ActionCard
                iconName="alert-circle"
                iconBg="rgba(179,59,59,0.2)"
                iconColor={c.danger}
                title={t.sos.actions.urgent}
                desc={t.sos.actions.urgentDesc}
                surface="#FEF2F2"
                textColor={c.danger}
                descColor={c.danger}
                borderColor={c.danger}
                onPress={() => pickAction("urgent")}
                emphasis
              />
            </View>

            <HotlinesBlock language={language} title={t.sos.hotlines} c={c} />

            <View
              style={[
                styles.confidentialityNote,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text style={[styles.confidentialityText, { color: c.textLight }]}>
                {t.sos.confidentialityNote}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.sentCard, { borderColor: c.success }]}>
              <View
                style={[
                  styles.heartWrap,
                  { backgroundColor: "rgba(34,197,94,0.15)" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={32} color={c.success} />
              </View>
              <Text style={[styles.sentTitle, { color: c.text }]}>
                {t.sos.urgentSentTitle}
              </Text>
              <Text style={[styles.sentBody, { color: c.textLight }]}>
                {t.sos.urgentSentBody}
              </Text>
            </View>

            <HotlinesBlock language={language} title={t.sos.hotlines} c={c} />

            <Pressable
              onPress={() => back()}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: c.surface },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.doneText, { color: c.text }]}>
                {t.common.done}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={confirmUrgent}
        onCancel={() => setConfirmOpen(false)}
        title={t.sos.urgentConfirmTitle}
        description={t.sos.urgentConfirmBody}
        confirmLabel={t.sos.urgentConfirmCta}
        variant="danger"
      />
    </View>
  );
}

function ActionCard({
  iconName,
  iconBg,
  iconColor,
  title,
  desc,
  surface,
  textColor,
  descColor,
  borderColor,
  onPress,
  emphasis = false,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  surface: string;
  textColor: string;
  descColor: string;
  borderColor: string;
  onPress: () => void;
  emphasis?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: surface,
          borderColor,
          borderWidth: emphasis ? 2 : 1,
        },
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.actionDesc, { color: descColor }]}>{desc}</Text>
      </View>
    </Pressable>
  );
}

function HotlinesBlock({
  language,
  title,
  c,
}: {
  language: "ru" | "kz";
  title: string;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.hotlinesSection}>
      <View style={styles.hotlinesHeader}>
        <Ionicons name="shield" size={16} color={c.danger} />
        <Text style={[styles.hotlinesTitle, { color: c.text }]}>{title}</Text>
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
            <Text style={[styles.hotlineNumber, { color: c.danger }]}>
              {h.number}
            </Text>
            <Text style={[styles.hotlineLabel, { color: c.textLight }]}>
              {language === "kz" ? h.labelKz : h.labelRu}
            </Text>
          </View>
        </Pressable>
      ))}
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

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },

  actionList: { gap: 12 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: radius.lg,
    padding: 18,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "700" },
  actionDesc: { fontSize: 12, marginTop: 2 },

  sentCard: {
    marginTop: 24,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: "#F0FDF4",
    padding: 24,
    alignItems: "center",
  },
  sentTitle: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  sentBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  doneBtn: {
    marginTop: 24,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    ...shadow(1),
  },
  doneText: { fontSize: 14, fontWeight: "700" },

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
  hotlineNumber: { fontSize: 18, fontWeight: "800" },
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
