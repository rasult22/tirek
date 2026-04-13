import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Card, StatusBadge } from "../ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import {
  statusToRiskLevel,
  type MoodTrendResult,
  type EngagementResult,
} from "../../lib/utils/mood-analytics";
import type { User } from "@tirek/shared";

interface StudentHeroCardProps {
  student: User;
  status: "normal" | "attention" | "crisis";
  moodTrend: MoodTrendResult;
  engagement: EngagementResult;
}

const statusRingColors: Record<string, string> = {
  normal: "#16794A",
  attention: "#8C6308",
  crisis: "#B33B3B",
};

const trendIconNames: Record<string, keyof typeof Ionicons.glyphMap> = {
  improving: "trending-up",
  stable: "remove-outline",
  declining: "trending-down",
};

const trendColorMap = {
  improving: "success",
  stable: "textLight",
  declining: "danger",
} as const;

const riskColorMap = {
  low: "success",
  medium: "warning",
  high: "danger",
} as const;

const engagementColorMap = {
  high: "success",
  medium: "warning",
  low: "textLight",
} as const;

export function StudentHeroCard({
  student,
  status,
  moodTrend,
  engagement,
}: StudentHeroCardProps) {
  const t = useT();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;
  const riskLevel = statusToRiskLevel(status);

  const trendLabels = {
    improving: d.improving,
    stable: d.stable,
    declining: d.declining,
  };
  const riskLabels = {
    low: d.riskLow,
    medium: d.riskMedium,
    high: d.riskHigh,
  };
  const engagementLabels = {
    high: d.engagementHigh,
    medium: d.engagementMedium,
    low: d.engagementLow,
  };

  const trendColor = c[trendColorMap[moodTrend.trend]];
  const riskColor = c[riskColorMap[riskLevel]];
  const engColor = c[engagementColorMap[engagement.level]];

  return (
    <Card elevated>
      <View style={styles.topRow}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: `${c.primary}1A`,
              borderColor: statusRingColors[status],
            },
          ]}
        >
          <Text
            style={[styles.avatarText, { color: c.primary }]}
          >
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              variant="h2"
              style={styles.nameText}
              numberOfLines={1}
            >
              {student.name}
            </Text>
            <StatusBadge status={status} size="sm" />
          </View>
          <Text variant="small" numberOfLines={1}>
            {student.grade != null
              ? `${student.grade}${student.classLetter ?? ""} ${d.class}`
              : ""}{" "}
            · {student.email}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {/* Mood Trend */}
        <View
          style={[
            styles.metricPill,
            { backgroundColor: c.surfaceSecondary },
          ]}
        >
          <View style={styles.metricValue}>
            <Text style={[styles.metricNumber, { color: c.text }]}>
              {moodTrend.average > 0 ? moodTrend.average.toFixed(1) : "—"}
            </Text>
            <Ionicons
              name={trendIconNames[moodTrend.trend]}
              size={14}
              color={trendColor}
            />
          </View>
          <Text style={[styles.metricLabel, { color: trendColor }]}>
            {trendLabels[moodTrend.trend]}
          </Text>
          <Text style={[styles.metricSub, { color: c.textLight }]}>
            {d.moodTrend}
          </Text>
        </View>

        {/* Risk Level */}
        <View
          style={[
            styles.metricPill,
            { backgroundColor: c.surfaceSecondary },
          ]}
        >
          <View style={styles.metricValue}>
            <Ionicons name="shield-checkmark" size={14} color={riskColor} />
            <Text style={[styles.metricLabelBold, { color: riskColor }]}>
              {riskLabels[riskLevel]}
            </Text>
          </View>
          <Text style={[styles.metricSub, { color: c.textLight, marginTop: 4 }]}>
            {d.riskLevel}
          </Text>
        </View>

        {/* Engagement */}
        <View
          style={[
            styles.metricPill,
            { backgroundColor: c.surfaceSecondary },
          ]}
        >
          <View style={styles.metricValue}>
            <Ionicons name="pulse" size={14} color={engColor} />
            <Text style={[styles.metricNumber, { color: c.text }]}>
              {engagement.activeDays}/{engagement.totalDays}
            </Text>
          </View>
          <Text style={[styles.metricLabel, { color: engColor }]}>
            {engagementLabels[engagement.level]}
          </Text>
          <Text style={[styles.metricSub, { color: c.textLight }]}>
            {d.engagement}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: "DMSans-Bold",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nameText: {
    flexShrink: 1,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 12,
  },
  metricPill: {
    flex: 1,
    borderRadius: radius.md,
    padding: 10,
    alignItems: "center",
  },
  metricValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricNumber: {
    fontSize: 15,
    fontFamily: "DMSans-Bold",
  },
  metricLabelBold: {
    fontSize: 12,
    fontFamily: "DMSans-Bold",
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: "DMSans-SemiBold",
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    fontFamily: "DMSans-Regular",
  },
});
