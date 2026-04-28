import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text, Card } from "../../components/ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { officeHoursApi } from "../../lib/api/office-hours";

const DOW_LABELS: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

export default function OfficeHoursScreen() {
  const colors = useThemeColors();
  const { data, isLoading } = useQuery({
    queryKey: ["office-hours-template"],
    queryFn: () => officeHoursApi.getTemplate(),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Office hours" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.note, { color: colors.textLight }]}>
          Редактирование расписания временно недоступно — переезжаем на новую модель
          (шаблон недели + исключения по дате).
        </Text>
        {isLoading ? (
          <Text style={{ color: colors.textLight }}>Загрузка…</Text>
        ) : !data || data.length === 0 ? (
          <Text style={{ color: colors.textLight }}>Шаблон не задан.</Text>
        ) : (
          data.map((row) => (
            <Card key={row.id} style={styles.card}>
              <Text style={styles.dow}>{DOW_LABELS[row.dayOfWeek]}</Text>
              <Text style={{ color: colors.textLight }}>
                {row.intervals.length === 0
                  ? "выходной"
                  : row.intervals.map((iv) => `${iv.start}–${iv.end}`).join(", ")}
              </Text>
              {row.notes ? (
                <Text style={[styles.notes, { color: colors.textLight }]}>{row.notes}</Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  dow: {
    fontWeight: "600",
  },
  notes: {
    fontStyle: "italic",
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
