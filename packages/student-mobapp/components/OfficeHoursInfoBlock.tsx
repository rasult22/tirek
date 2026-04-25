import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { OfficeHoursInfoBlock as Block } from "@tirek/shared";
import { Text, Card } from "./ui";
import { useT } from "../lib/hooks/useLanguage";
import { useThemeColors, spacing, radius } from "../lib/theme";
import { officeHoursApi } from "../lib/api/office-hours";

function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function toText(block: Block, t: ReturnType<typeof useT>): string {
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
    case "available_tomorrow":
      return block.notes
        ? format(i.availableTomorrowWithNotes, {
            from: block.from,
            until: block.until,
            notes: block.notes,
          })
        : format(i.availableTomorrow, { from: block.from, until: block.until });
    case "unavailable_today":
      return i.unavailableToday;
  }
}

export function OfficeHoursInfoBlock() {
  const t = useT();
  const c = useThemeColors();
  const { data } = useQuery({
    queryKey: ["office-hours", "info-block"],
    queryFn: officeHoursApi.infoBlock,
    refetchInterval: 5 * 60 * 1000,
  });

  if (!data) return null;

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: c.officeHoursPurpleBg }]}>
        <Ionicons name="time-outline" size={22} color={c.officeHoursPurple} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.caption, { color: c.officeHoursPurple }]}>
          {t.officeHours.info.title}
        </Text>
        <Text variant="body" style={[styles.text, { color: c.text }]}>
          {toText(data, t)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  caption: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  text: { marginTop: 2, fontWeight: "600" },
});
