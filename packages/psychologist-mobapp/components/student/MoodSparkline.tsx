import { View, StyleSheet } from "react-native";
import Svg, {
  Polyline,
  Circle,
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Card } from "../ui";
import { useThemeColors, spacing } from "../../lib/theme";
import type { MoodEntry } from "@tirek/shared";

const moodEmojis: Record<number, string> = {
  1: "\u{1F622}",
  2: "\u{1F61F}",
  3: "\u{1F610}",
  4: "\u{1F60A}",
  5: "\u{1F929}",
};

const dotColors: Record<number, string> = {
  1: "#B33B3B",
  2: "#8C6308",
  3: "#CA8A04",
  4: "#16794A",
  5: "#059669",
};

interface MoodSparklineProps {
  data: { date: string; mood: number }[];
  average: number;
  latestEntry?: MoodEntry;
}

export function MoodSparkline({
  data,
  average,
  latestEntry,
}: MoodSparklineProps) {
  const t = useT();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;

  if (data.length === 0) {
    return (
      <Card>
        <Text variant="bodyLight" style={styles.emptyText}>
          {d.noMoodData}
        </Text>
      </Card>
    );
  }

  const width = 320;
  const height = 72;
  const padX = 12;
  const padY = 10;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((item, i) => {
    const x =
      data.length === 1
        ? padX + chartW / 2
        : padX + (i / (data.length - 1)) * chartW;
    const y = padY + chartH - ((item.mood - 1) / 4) * chartH;
    return { x, y, mood: item.mood, date: item.date };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath = [
    `M ${points[0].x},${padY + chartH}`,
    `L ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`,
    `L ${points[points.length - 1].x},${padY + chartH}`,
    "Z",
  ].join(" ");

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="h3">
          {d.moodTrend} ({d.days14})
        </Text>
        <Text variant="small" style={{ color: c.textLight }}>
          {d.average}: {average.toFixed(1)}
        </Text>
      </View>

      <Svg
        viewBox={`0 0 ${width} ${height}`}
        style={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={c.primary} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={c.primary} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {[1, 2, 3, 4, 5].map((level) => {
          const y = padY + chartH - ((level - 1) / 4) * chartH;
          return (
            <Line
              key={level}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke={c.border}
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
          );
        })}

        <Path d={areaPath} fill="url(#sparkFill)" />

        <Polyline
          points={polyline}
          fill="none"
          stroke={c.primary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={dotColors[p.mood] ?? c.primary}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {latestEntry && (
        <View style={[styles.detailsRow, { borderTopColor: c.borderLight }]}>
          <Text style={styles.emoji}>
            {moodEmojis[latestEntry.mood] ?? "—"}
          </Text>
          <View style={styles.detailsWrap}>
            <Text variant="small">
              <Text variant="small" style={{ fontWeight: "600", color: c.text }}>
                {d.currentMood}:
              </Text>{" "}
              {latestEntry.mood}/5
            </Text>
            {latestEntry.energy != null && (
              <Text variant="small">
                <Text variant="small" style={{ fontWeight: "600", color: c.text }}>
                  {d.energy}:
                </Text>{" "}
                {latestEntry.energy}/5
              </Text>
            )}
            {latestEntry.stressLevel != null && (
              <Text variant="small">
                <Text variant="small" style={{ fontWeight: "600", color: c.text }}>
                  {d.stress}:
                </Text>{" "}
                {latestEntry.stressLevel}/5
              </Text>
            )}
            {latestEntry.sleepQuality != null && (
              <Text variant="small">
                <Text variant="small" style={{ fontWeight: "600", color: c.text }}>
                  {d.sleep}:
                </Text>{" "}
                {latestEntry.sleepQuality}/5
              </Text>
            )}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  svg: {
    width: "100%",
    height: 80,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  emoji: {
    fontSize: 20,
  },
  detailsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
