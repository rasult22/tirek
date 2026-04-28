import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { OfficeHoursInfoBlock as Block } from "@tirek/shared";
import { Text, Card } from "./ui";
import { useT } from "../lib/hooks/useLanguage";
import { useThemeColors, spacing, radius } from "../lib/theme";
import { hapticLight, hapticHeavy } from "../lib/haptics";
import { officeHoursApi } from "../lib/api/office-hours";

function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function statusLine(block: Block, t: ReturnType<typeof useT>): string {
  const i = t.officeHours.info;
  switch (block.kind) {
    case "available_now":
      return block.notes
        ? format(i.availableNowWithNotes, { until: block.until, notes: block.notes })
        : format(i.availableNow, { until: block.until });
    case "available_later_today":
      return block.notes
        ? format(i.availableLaterTodayWithNotes, {
            from: block.from,
            until: block.until,
            notes: block.notes,
          })
        : format(i.availableLaterToday, { from: block.from, until: block.until });
    case "finished_today":
      return block.notes
        ? format(i.finishedTodayWithNotes, { lastEnd: block.lastEnd, notes: block.notes })
        : format(i.finishedToday, { lastEnd: block.lastEnd });
    case "day_off_today":
      return i.dayOffToday;
  }
}

function tomorrowLine(block: Block, t: ReturnType<typeof useT>): string | null {
  const i = t.officeHours.info;
  if (block.kind === "finished_today" || block.kind === "day_off_today") {
    if (block.tomorrowFrom && block.tomorrowUntil) {
      return format(i.tomorrowFromUntil, {
        from: block.tomorrowFrom,
        until: block.tomorrowUntil,
      });
    }
  }
  return null;
}

export function OfficeHoursInfoBlock() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["office-hours", "info-block"],
    queryFn: officeHoursApi.infoBlock,
    refetchInterval: 5 * 60 * 1000,
  });

  if (!data) return null;
  const tomorrow = tomorrowLine(data, t);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: c.officeHoursPurpleBg }]}>
          <Ionicons name="time-outline" size={22} color={c.officeHoursPurple} />
        </View>
        <View style={styles.headerBody}>
          <Text variant="body" style={[styles.name, { color: c.text }]}>
            {data.psychologist.name}
          </Text>
          <Text variant="body" style={[styles.status, { color: c.text }]}>
            {statusLine(data, t)}
          </Text>
          {tomorrow && (
            <Text variant="caption" style={[styles.tomorrow, { color: c.textLight }]}>
              {tomorrow}
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={() => {
          hapticLight();
          router.push("/(screens)/messages" as never);
        }}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: c.officeHoursPurple },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        accessibilityLabel={t.officeHours.info.messageCta}
      >
        <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
        <Text variant="body" style={styles.ctaText}>
          {t.officeHours.info.messageCta}
        </Text>
      </Pressable>

      <View style={styles.crisisRow}>
        <Ionicons name="alert-circle-outline" size={14} color={c.danger} style={styles.crisisIcon} />
        <Text variant="caption" style={[styles.crisisText, { color: c.textLight }]}>
          {t.officeHours.info.crisisHint}
          <Text
            variant="caption"
            style={[styles.crisisSos, { color: c.danger }]}
            onPress={() => {
              hapticHeavy();
              router.push("/(screens)/sos" as never);
            }}
          >
            {t.officeHours.info.crisisHintSos}
          </Text>
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBody: { flex: 1 },
  name: { fontWeight: "700", marginBottom: 2 },
  status: { fontWeight: "500" },
  tomorrow: { marginTop: 2 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700" },
  crisisRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  crisisIcon: { marginTop: 2 },
  crisisText: { flex: 1, fontSize: 12, lineHeight: 16 },
  crisisSos: { fontWeight: "700", textDecorationLine: "underline" },
});
