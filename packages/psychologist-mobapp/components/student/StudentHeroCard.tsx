import { View, StyleSheet } from "react-native";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { Card, StatusBadge, H3, Body, MoodScale, type MoodValue } from "../ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { formatRiskReason } from "@tirek/shared";
import type { RiskReason } from "@tirek/shared/api";
import type { User, MoodEntry } from "@tirek/shared";

interface StudentHeroCardProps {
  student: User;
  status: "normal" | "attention" | "crisis";
  reason: RiskReason | null;
  /** Latest mood entry — surfaced as a compact MoodScale next to the name. */
  latestMood?: MoodEntry;
}

export function StudentHeroCard({
  student,
  status,
  reason,
  latestMood,
}: StudentHeroCardProps) {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;
  const reasonText =
    status !== "normal" ? formatRiskReason({ reason, t, language }) : null;
  const reasonColor = status === "crisis" ? c.danger : c.warning;
  const showRing = status !== "normal";
  const ringColor = status === "crisis" ? c.danger : c.warning;

  const classText =
    student.grade != null
      ? `${student.grade}${student.classLetter ?? ""} ${d.class}`
      : null;

  const moodValue: MoodValue | null =
    latestMood && latestMood.mood >= 1 && latestMood.mood <= 5
      ? (latestMood.mood as MoodValue)
      : null;

  return (
    <Card variant="floating">
      <View style={styles.topRow}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: `${c.primary}1A`,
              borderColor: showRing ? ringColor : "transparent",
              borderWidth: showRing ? 3 : 0,
            },
          ]}
        >
          <Body style={[styles.avatarText, { color: c.primary }]}>
            {student.name.charAt(0).toUpperCase()}
          </Body>
        </View>
        <View style={styles.info}>
          <H3 style={styles.nameText} numberOfLines={2}>
            {student.name}
          </H3>
          {classText && (
            <Body size="xs" numberOfLines={1} style={{ color: c.textLight }}>
              {classText}
            </Body>
          )}
          {status !== "normal" && (
            <View style={styles.statusRow}>
              <StatusBadge status={status} size="sm" />
              {reasonText && (
                <Body
                  size="xs"
                  numberOfLines={2}
                  style={[styles.reasonText, { color: reasonColor }]}
                >
                  {reasonText}
                </Body>
              )}
            </View>
          )}
          {moodValue != null && (
            <View style={styles.moodRow}>
              <Body size="xs" style={{ color: c.textLight }}>
                {d.currentMood}
              </Body>
              <MoodScale
                value={moodValue}
                accessibilityLabel={`${d.currentMood} ${moodValue}/5`}
              />
              <Body size="xs" style={{ color: c.textLight }}>
                {moodValue}/5
              </Body>
            </View>
          )}
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
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameText: {
    flexShrink: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
    flexWrap: "wrap",
  },
  reasonText: {
    flexShrink: 1,
    fontWeight: "600",
  },
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
});
