import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Text } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT } from "../../lib/hooks/useLanguage";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { moodApi } from "../../lib/api/mood";
import { useThemeColors, spacing } from "../../lib/theme";
import { Last7DaysMood } from "../../components/Last7DaysMood";

export default function MoodHistoryScreen() {
  const t = useT();
  const c = useThemeColors();
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const needPrev = today.getDate() <= 7;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const { data: currentMonth, isError: errCurrent, refetch: refetchCurrent } = useQuery({
    queryKey: ["mood", "calendar", `${year}-${month}`],
    queryFn: () => moodApi.calendar(year, month),
  });

  const { data: previousMonth, isError: errPrev, refetch: refetchPrev } = useQuery({
    queryKey: ["mood", "calendar", `${prevYear}-${prevMonth}`],
    queryFn: () => moodApi.calendar(prevYear, prevMonth),
    enabled: needPrev,
  });

  const { refreshing, onRefresh } = useRefresh(async () => {
    await refetchCurrent();
    if (needPrev) await refetchPrev();
  });

  if (errCurrent || (needPrev && errPrev)) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <ErrorState onRetry={() => { refetchCurrent(); if (needPrev) refetchPrev(); }} />
      </View>
    );
  }

  const entries = [...(currentMonth ?? []), ...(previousMonth ?? [])];

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
        <Last7DaysMood
          entries={entries}
          today={today}
          weekdayShort={t.mood.weekdays}
          emptyLabel={t.mood.historyEmpty}
        />
        <Text style={[styles.hint, { color: c.textLight }]}>{t.mood.historyHint}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  hint: {
    marginTop: 16,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
