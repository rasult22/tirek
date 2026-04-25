import { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Text, Button, Card } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { officeHoursApi } from "../../lib/api/office-hours";
import type { OfficeHoursInterval } from "@tirek/shared";

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoAlmaty(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((v) => Number.parseInt(v, 10));
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return (
    `${dt.getUTCFullYear()}-` +
    `${String(dt.getUTCMonth() + 1).padStart(2, "0")}-` +
    `${String(dt.getUTCDate()).padStart(2, "0")}`
  );
}

function validateLocal(intervals: OfficeHoursInterval[]): string | null {
  for (const { start, end } of intervals) {
    if (!HHMM_RE.test(start) || !HHMM_RE.test(end)) return "format";
    if (start >= end) return "order";
  }
  const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.start < sorted[i - 1]!.end) return "overlap";
  }
  return null;
}

export default function OfficeHoursScreen() {
  const t = useT();
  const c = useThemeColors();
  const psychologistId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const [date, setDate] = useState(todayIsoAlmaty());
  const [intervals, setIntervals] = useState<OfficeHoursInterval[]>([]);
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const { data } = useQuery({
    queryKey: ["office-hours", psychologistId, date],
    queryFn: () =>
      psychologistId ? officeHoursApi.getByDate(psychologistId, date) : null,
    enabled: !!psychologistId && DATE_RE.test(date),
  });

  useEffect(() => {
    if (!touched) {
      setIntervals(data?.intervals ?? []);
      setNotes(data?.notes ?? "");
    }
  }, [data, touched]);

  const upsert = useMutation({
    mutationFn: () =>
      officeHoursApi.upsert(date, intervals, notes.trim() || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-hours"] });
      setTouched(false);
    },
  });

  function updateInterval(index: number, patch: Partial<OfficeHoursInterval>) {
    setTouched(true);
    setIntervals((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  }

  function addInterval() {
    hapticLight();
    setTouched(true);
    setIntervals((prev) => [...prev, { start: "09:00", end: "12:00" }]);
  }

  function removeInterval(index: number) {
    hapticLight();
    setTouched(true);
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  }

  function shiftDay(days: number) {
    hapticLight();
    setDate(shiftDate(date, days));
    setTouched(false);
  }

  const validationError = validateLocal(intervals);
  const canSave = touched && !validationError;

  return (
    <>
      <Stack.Screen options={{ title: t.officeHours.title }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.bg }]}
        edges={["bottom"]}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <Text variant="h3">{t.officeHours.selectDate}</Text>
            <View style={styles.dateRow}>
              <Pressable
                onPress={() => shiftDay(-1)}
                style={[styles.dateArrow, { borderColor: c.borderLight }]}
              >
                <Ionicons name="chevron-back" size={20} color={c.primary} />
              </Pressable>
              <View
                style={[
                  styles.dateDisplay,
                  { borderColor: c.borderLight, backgroundColor: c.surface },
                ]}
              >
                <Ionicons name="calendar-outline" size={18} color={c.primary} />
                <Text variant="body" style={{ color: c.text }}>{date}</Text>
              </View>
              <Pressable
                onPress={() => shiftDay(1)}
                style={[styles.dateArrow, { borderColor: c.borderLight }]}
              >
                <Ionicons name="chevron-forward" size={20} color={c.primary} />
              </Pressable>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.headerRow}>
              <Text variant="h3">{t.officeHours.title}</Text>
              <Pressable
                onPress={addInterval}
                style={[styles.addButton, { backgroundColor: c.primary }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text variant="body" style={styles.addButtonText}>
                  {t.officeHours.addInterval}
                </Text>
              </Pressable>
            </View>

            {intervals.length === 0 ? (
              <Text
                variant="body"
                style={{ color: c.textLight, marginTop: spacing.md }}
              >
                {t.officeHours.dayEmpty}
              </Text>
            ) : (
              <View style={styles.intervalList}>
                {intervals.map((it, idx) => (
                  <View
                    key={idx}
                    style={[styles.intervalRow, { borderColor: c.borderLight }]}
                  >
                    <TextInput
                      value={it.start}
                      onChangeText={(v) => updateInterval(idx, { start: v })}
                      placeholder="09:00"
                      placeholderTextColor={c.textLight}
                      maxLength={5}
                      style={[
                        styles.timeInput,
                        { borderColor: c.borderLight, color: c.text },
                      ]}
                    />
                    <Text variant="body" style={{ color: c.textLight }}>—</Text>
                    <TextInput
                      value={it.end}
                      onChangeText={(v) => updateInterval(idx, { end: v })}
                      placeholder="17:00"
                      placeholderTextColor={c.textLight}
                      maxLength={5}
                      style={[
                        styles.timeInput,
                        { borderColor: c.borderLight, color: c.text },
                      ]}
                    />
                    <Pressable
                      onPress={() => removeInterval(idx)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={c.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: spacing.md }}>
              <Text variant="small" style={{ color: c.textLight }}>
                {t.officeHours.notesLabel}
              </Text>
              <TextInput
                value={notes}
                onChangeText={(v) => {
                  setTouched(true);
                  setNotes(v);
                }}
                placeholder={t.officeHours.notesPlaceholder}
                placeholderTextColor={c.textLight}
                maxLength={120}
                style={[
                  styles.input,
                  { borderColor: c.borderLight, color: c.text },
                ]}
              />
            </View>

            {validationError && (
              <Text
                variant="body"
                style={{ color: c.danger, marginTop: spacing.sm }}
              >
                {
                  t.officeHours.errors[
                    validationError as keyof typeof t.officeHours.errors
                  ]
                }
              </Text>
            )}

            <Button
              title={t.officeHours.save}
              onPress={() => upsert.mutate()}
              disabled={!canSave}
              loading={upsert.isPending}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { padding: spacing.lg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dateArrow: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  dateDisplay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  intervalList: { marginTop: spacing.md, gap: spacing.sm },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    width: 82,
    textAlign: "center",
  },
  removeButton: { marginLeft: "auto", padding: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: 6,
    fontSize: 14,
  },
});
