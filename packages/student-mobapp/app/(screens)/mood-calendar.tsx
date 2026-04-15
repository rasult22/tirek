import { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT } from "../../lib/hooks/useLanguage";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { moodApi } from "../../lib/api/mood";
import { moodLevels } from "@tirek/shared";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";

const MOOD_COLORS: Record<number, string> = {
  1: "#FCA5A5",
  2: "#FDBA74",
  3: "#FDE047",
  4: "#86EFAC",
  5: "#34D399",
};

const FACTOR_EMOJI: Record<string, string> = {
  school: "\u{1F4DA}",
  friends: "\u{1F46B}",
  family: "\u{1F3E0}",
  health: "\u{1F4AA}",
  social: "\u{1F4F1}",
  other: "\u{1F4A1}",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function MoodCalendarScreen() {
  const t = useT();
  const c = useThemeColors();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: calendarData, isError, refetch } = useQuery({
    queryKey: ["mood", "calendar", `${year}-${String(month + 1).padStart(2, "0")}`],
    queryFn: () => moodApi.calendar(year, month + 1),
  });

  const { data: insights } = useQuery({
    queryKey: ["mood", "insights"],
    queryFn: moodApi.insights,
  });

  const selectedMood = useMemo(() => {
    if (!selectedDate || !calendarData) return null;
    return calendarData.find((d) => d.date === selectedDate) ?? null;
  }, [selectedDate, calendarData]);

  const moodMap = useMemo(() => {
    const map: Record<string, number> = {};
    calendarData?.forEach((d) => {
      map[d.date] = d.mood;
    });
    return map;
  }, [calendarData]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const { refreshing, onRefresh } = useRefresh(refetch);

  const factorLabels: Record<string, string> = {
    school: t.mood.factorSchool,
    friends: t.mood.factorFriends,
    family: t.mood.factorFamily,
    health: t.mood.factorHealth,
    social: t.mood.factorSocial,
    other: t.mood.factorOther,
  };

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={prevMonth} style={[styles.navBtn, { backgroundColor: c.surface }]}>
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </Pressable>
          <Text variant="h3">
            {t.mood.monthNames[month]} {year}
          </Text>
          <Pressable onPress={nextMonth} style={[styles.navBtn, { backgroundColor: c.surface }]}>
            <Ionicons name="chevron-forward" size={20} color={c.text} />
          </Pressable>
        </View>

        {/* Calendar grid */}
        <View style={[styles.calendarCard, { backgroundColor: c.surface }]}>
          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {t.mood.weekdays.map((d) => (
              <View key={d} style={styles.weekCell}>
                <Text style={[styles.weekLabel, { color: c.textLight }]}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Days */}
          <View style={styles.daysGrid}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const moodVal = moodMap[dateStr];
              const isToday = dateStr === todayStr;

              return (
                <View key={day} style={styles.dayCell}>
                  <Pressable
                    onPress={() => moodVal ? setSelectedDate(dateStr) : undefined}
                    style={[
                      styles.dayInner,
                      moodVal
                        ? { backgroundColor: MOOD_COLORS[moodVal] }
                        : isToday
                          ? { backgroundColor: `${c.primary}1A` }
                          : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: c.textLight },
                        moodVal ? { color: "#FFFFFF", fontWeight: "700" } : undefined,
                        isToday && !moodVal ? { color: c.primaryDark, fontWeight: "700" } : undefined,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Insights */}
        {insights && insights.weeklyAverage != null && (
          <View style={styles.insightsRow}>
            <View style={[styles.insightCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.insightLabel, { color: c.textLight }]}>{t.mood.weeklyAverage}</Text>
              <View style={styles.insightValue}>
                <Text style={{ fontSize: 24 }}>
                  {moodLevels.find((m) => m.value === Math.round(insights.weeklyAverage))?.emoji ?? "\u{1F610}"}
                </Text>
                <Text variant="number">{insights.weeklyAverage.toFixed(1)}</Text>
              </View>
            </View>
            <View style={[styles.insightCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.insightLabel, { color: c.textLight }]}>{t.mood.trend}</Text>
              <View style={styles.insightValue}>
                <Ionicons
                  name={
                    insights.trend === "improving"
                      ? "trending-up"
                      : insights.trend === "declining"
                        ? "trending-down"
                        : "remove"
                  }
                  size={24}
                  color={
                    insights.trend === "improving"
                      ? c.secondary
                      : insights.trend === "declining"
                        ? c.danger
                        : c.info
                  }
                />
                <Text style={[styles.trendText, { color: c.text }]}>
                  {insights.trend === "improving"
                    ? t.mood.trendUp
                    : insights.trend === "declining"
                      ? t.mood.trendDown
                      : t.mood.trendStable}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Top factors */}
        {insights &&
          Array.isArray(insights.topFactors) &&
          insights.topFactors.length > 0 && (
            <View style={[styles.factorsCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.insightLabel, { color: c.textLight }]}>{t.mood.topFactors}</Text>
              {(insights.topFactors as unknown as { factor: string; count: number }[]).map(
                (f) => (
                  <View key={f.factor} style={styles.factorRow}>
                    <Text style={{ fontSize: 18 }}>
                      {FACTOR_EMOJI[f.factor] ?? "\u{2753}"}
                    </Text>
                    <Text style={[styles.factorName, { color: c.text }]}>
                      {factorLabels[f.factor] ?? f.factor}
                    </Text>
                    <View style={[styles.factorBadge, { backgroundColor: c.surfaceSecondary }]}>
                      <Text style={[styles.factorCount, { color: c.textLight }]}>{f.count}</Text>
                    </View>
                  </View>
                ),
              )}
            </View>
          )}
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={!!selectedDate && !!selectedMood}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDate(null)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: c.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text variant="h3">{selectedDate}</Text>
              <Pressable onPress={() => setSelectedDate(null)}>
                <Ionicons name="close" size={20} color={c.textLight} />
              </Pressable>
            </View>
            {selectedMood && (
              <View style={styles.modalBody}>
                <Text style={{ fontSize: 48 }}>
                  {moodLevels.find((m) => m.value === selectedMood.mood)?.emoji}
                </Text>
                <Text variant="h3" style={{ marginTop: 8 }}>
                  {[t.mood.level1, t.mood.level2, t.mood.level3, t.mood.level4, t.mood.level5][selectedMood.mood - 1]}
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },

  calendarCard: {
    marginTop: 16,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(1),
  },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekCell: { flex: 1, alignItems: "center" },
  weekLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 12 },

  insightsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  insightCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(1),
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  insightValue: { flexDirection: "row", alignItems: "center", gap: 8 },
  trendText: { fontSize: 13, fontWeight: "700" },

  factorsCard: {
    marginTop: 16,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(1),
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  factorName: { flex: 1, fontSize: 14, fontWeight: "500" },
  factorBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  factorCount: { fontSize: 12, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    ...shadow(3),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBody: {
    alignItems: "center",
    marginTop: 16,
    paddingBottom: 16,
  },
});
