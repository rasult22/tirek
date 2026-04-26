import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { buildLast7Days, type MoodCalendarDay, moodLevels } from "@tirek/shared";
import { Text } from "./ui";
import { useThemeColors, radius, spacing } from "../lib/theme";
import { shadow } from "../lib/theme/shadows";

const MOOD_DOT_COLOR: Record<number, string> = {
  1: "#FCA5A5",
  2: "#FDBA74",
  3: "#FDE047",
  4: "#86EFAC",
  5: "#34D399",
};

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

function weekdayIndexAlmaty(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map((p) => Number.parseInt(p, 10));
  const utcMidnight = Date.UTC(y, m - 1, d);
  const inAlmaty = new Date(utcMidnight + ALMATY_OFFSET_MS);
  const day = inAlmaty.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

interface Props {
  entries: MoodCalendarDay[];
  today: Date;
  weekdayShort: readonly string[];
  emptyLabel?: string;
}

export function Last7DaysMood({ entries, today, weekdayShort, emptyLabel }: Props) {
  const c = useThemeColors();
  const days = useMemo(() => buildLast7Days(entries, today), [entries, today]);
  const allEmpty = days.every((d) => d.daySlotMood == null && d.eveningSlotMood == null);

  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.row}>
        {days.map((d) => {
          const wIdx = weekdayIndexAlmaty(d.date);
          const dayPart = Number.parseInt(d.date.slice(8, 10), 10);
          return (
            <View key={d.date} style={styles.col}>
              <Text style={[styles.weekLabel, { color: c.textLight }]}>
                {weekdayShort[wIdx]}
              </Text>
              <Text style={[styles.dayNum, { color: c.text }]}>{dayPart}</Text>
              <View style={styles.dots}>
                <Dot mood={d.daySlotMood} borderColor={c.borderLight ?? "#E5E7EB"} />
                <Dot mood={d.eveningSlotMood} borderColor={c.borderLight ?? "#E5E7EB"} />
              </View>
            </View>
          );
        })}
      </View>

      {allEmpty && emptyLabel && (
        <Text style={[styles.empty, { color: c.textLight }]}>{emptyLabel}</Text>
      )}

      <View style={styles.legend}>
        {moodLevels.map((m) => (
          <Text key={m.value} style={styles.legendEmoji}>
            {m.emoji}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Dot({ mood, borderColor }: { mood: number | null; borderColor: string }) {
  if (mood == null) {
    return (
      <View
        style={[
          styles.dot,
          { borderWidth: 1, borderStyle: "dashed", borderColor, backgroundColor: "transparent" },
        ]}
      />
    );
  }
  return <View style={[styles.dot, { backgroundColor: MOOD_DOT_COLOR[mood] ?? "#D1D5DB" }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(1),
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  col: { alignItems: "center", flex: 1, gap: 4 },
  weekLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dayNum: { fontSize: 12, fontWeight: "600" },
  dots: { gap: 4, marginTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  empty: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  legendEmoji: { fontSize: 12 },
});
