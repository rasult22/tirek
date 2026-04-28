import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, Card, Button } from "../../components/ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { officeHoursApi } from "../../lib/api/office-hours";
import { useAuthStore } from "../../lib/store/auth-store";
import { hapticLight } from "../../lib/haptics";
import { isDayOff } from "@tirek/shared/office-hours";
import type {
  OfficeHoursDayOfWeek,
  OfficeHoursInterval,
  OfficeHoursTemplateEntry,
  OfficeHoursOverrideEntry,
  OfficeHoursResolved,
} from "@tirek/shared";
import { IntervalsEditorSheet } from "../../components/office-hours/IntervalsEditorSheet";
import { OverrideEditorSheet } from "../../components/office-hours/OverrideEditorSheet";

const DOW_LABELS: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

function todayIso(now: Date = new Date()): string {
  const a = new Date(now.getTime() + ALMATY_OFFSET_MS);
  return `${a.getUTCFullYear()}-${String(a.getUTCMonth() + 1).padStart(2, "0")}-${String(a.getUTCDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((v) => Number.parseInt(v, 10));
  const utc = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

function formatIntervals(intervals: OfficeHoursInterval[]): string {
  if (isDayOff(intervals)) return "выходной";
  return intervals.map((iv) => `${iv.start}–${iv.end}`).join(", ");
}

function formatHumanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((v) => Number.parseInt(v, 10));
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  const month = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][m! - 1];
  return `${DOW_LABELS[dow]} ${d} ${month}`;
}

export default function OfficeHoursScreen() {
  const c = useThemeColors();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const psychologistId = user?.id ?? "";

  const today = todayIso();
  const overrideRangeFrom = today;
  const overrideRangeTo = addDaysIso(today, 28);

  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ["office-hours-template"],
    queryFn: () => officeHoursApi.getTemplate(),
  });

  const { data: overrides } = useQuery({
    queryKey: ["office-hours-overrides", overrideRangeFrom, overrideRangeTo],
    queryFn: () => officeHoursApi.getOverrides(overrideRangeFrom, overrideRangeTo),
  });

  const { data: todayResolved } = useQuery({
    queryKey: ["office-hours-resolve", psychologistId, today],
    queryFn: () => officeHoursApi.resolve(psychologistId, today),
    enabled: psychologistId.length > 0,
  });

  const { data: tomorrowResolved } = useQuery({
    queryKey: ["office-hours-resolve", psychologistId, addDaysIso(today, 1)],
    queryFn: () => officeHoursApi.resolve(psychologistId, addDaysIso(today, 1)),
    enabled: psychologistId.length > 0,
  });

  const templateByDow = useMemo(() => {
    const m = new Map<number, OfficeHoursTemplateEntry>();
    for (const row of template ?? []) m.set(row.dayOfWeek, row);
    return m;
  }, [template]);

  const sortedOverrides = useMemo(() => {
    return [...(overrides ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [overrides]);

  // ── Sheets ────────────────────────────────────────────────────────────
  const [editingDow, setEditingDow] = useState<OfficeHoursDayOfWeek | null>(null);
  const [overrideMode, setOverrideMode] = useState<
    | { kind: "create" }
    | { kind: "edit"; date: string; intervals: OfficeHoursInterval[]; notes: string | null }
    | null
  >(null);

  const editingTemplateRow = editingDow != null ? templateByDow.get(editingDow) : null;

  const upsertTemplateMut = useMutation({
    mutationFn: ({
      dayOfWeek,
      intervals,
      notes,
    }: {
      dayOfWeek: OfficeHoursDayOfWeek;
      intervals: OfficeHoursInterval[];
      notes: string | null;
    }) => officeHoursApi.upsertTemplateDay(dayOfWeek, intervals, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-template"] });
      qc.invalidateQueries({ queryKey: ["office-hours-resolve"] });
      setEditingDow(null);
    },
  });

  const upsertOverrideMut = useMutation({
    mutationFn: ({
      date,
      intervals,
      notes,
    }: {
      date: string;
      intervals: OfficeHoursInterval[];
      notes: string | null;
    }) => officeHoursApi.upsertOverrideDay(date, intervals, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-overrides"] });
      qc.invalidateQueries({ queryKey: ["office-hours-resolve"] });
      setOverrideMode(null);
    },
  });

  const deleteOverrideMut = useMutation({
    mutationFn: (date: string) => officeHoursApi.deleteOverrideDay(date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-overrides"] });
      qc.invalidateQueries({ queryKey: ["office-hours-resolve"] });
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Расписание" }} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* ── Шаблон недели ───────────────────────────────────────── */}
        <Text variant="h3">Шаблон недели</Text>
        {loadingTemplate ? (
          <Text style={{ color: c.textLight }}>Загрузка…</Text>
        ) : (
          <Card style={styles.templateCard}>
            {([1, 2, 3, 4, 5, 6, 7] as OfficeHoursDayOfWeek[]).map((dow, i) => {
              const row = templateByDow.get(dow);
              const intervals = row?.intervals ?? [];
              return (
                <Pressable
                  key={dow}
                  onPress={() => {
                    hapticLight();
                    setEditingDow(dow);
                  }}
                  style={({ pressed }) => [
                    styles.dowRow,
                    i < 6 && { borderBottomWidth: 1, borderBottomColor: c.borderLight },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.dowLabel}>{DOW_LABELS[dow]}</Text>
                  <Text
                    style={[
                      styles.dowValue,
                      { color: isDayOff(intervals) ? c.textLight : c.text },
                    ]}
                  >
                    {formatIntervals(intervals)}
                  </Text>
                  <Ionicons name="pencil-outline" size={18} color={c.textLight} />
                </Pressable>
              );
            })}
          </Card>
        )}

        {/* ── Исключения ──────────────────────────────────────────── */}
        <Text variant="h3" style={{ marginTop: spacing.md }}>
          Исключения
        </Text>
        <Text variant="caption" style={{ color: c.textLight }}>
          Ближайшие 4 недели
        </Text>
        {sortedOverrides.length === 0 ? (
          <Text style={{ color: c.textLight }}>Исключений нет.</Text>
        ) : (
          <Card style={styles.overridesCard}>
            {sortedOverrides.map((ov: OfficeHoursOverrideEntry, i) => (
              <View
                key={ov.id}
                style={[
                  styles.overrideRow,
                  i < sortedOverrides.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: c.borderLight,
                  },
                ]}
              >
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => {
                    hapticLight();
                    setOverrideMode({
                      kind: "edit",
                      date: ov.date,
                      intervals: ov.intervals,
                      notes: ov.notes,
                    });
                  }}
                >
                  <Text style={styles.overrideDate}>{formatHumanDate(ov.date)}</Text>
                  <Text style={{ color: c.textLight }}>
                    {formatIntervals(ov.intervals)}
                    {ov.notes ? ` · ${ov.notes}` : ""}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    deleteOverrideMut.mutate(ov.date);
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="close" size={20} color={c.textLight} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
        <Button
          title="+ Добавить исключение"
          variant="secondary"
          onPress={() => {
            hapticLight();
            setOverrideMode({ kind: "create" });
          }}
        />

        {/* ── Превью ──────────────────────────────────────────────── */}
        <Text variant="h3" style={{ marginTop: spacing.md }}>
          Превью
        </Text>
        <Card style={styles.previewCard}>
          <PreviewLine label="Сегодня" resolved={todayResolved} colors={c} />
          <View style={{ height: 1, backgroundColor: c.borderLight, marginVertical: 8 }} />
          <PreviewLine label="Завтра" resolved={tomorrowResolved} colors={c} />
        </Card>
      </ScrollView>

      {/* ── Bottom sheets ─────────────────────────────────────────── */}
      {editingDow != null ? (
        <IntervalsEditorSheet
          open={editingDow != null}
          title={`Шаблон: ${DOW_LABELS[editingDow]}`}
          initialIntervals={editingTemplateRow?.intervals ?? []}
          initialNotes={editingTemplateRow?.notes ?? null}
          saving={upsertTemplateMut.isPending}
          onClose={() => setEditingDow(null)}
          onSave={(intervals, notes) => {
            upsertTemplateMut.mutate({ dayOfWeek: editingDow, intervals, notes });
          }}
        />
      ) : null}

      {overrideMode != null ? (
        <OverrideEditorSheet
          open
          fixedDate={overrideMode.kind === "edit" ? overrideMode.date : undefined}
          initialIntervals={overrideMode.kind === "edit" ? overrideMode.intervals : []}
          initialNotes={overrideMode.kind === "edit" ? overrideMode.notes : null}
          saving={upsertOverrideMut.isPending}
          onClose={() => setOverrideMode(null)}
          onSave={(date, intervals, notes) => {
            upsertOverrideMut.mutate({ date, intervals, notes });
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function PreviewLine({
  label,
  resolved,
  colors,
}: {
  label: string;
  resolved: OfficeHoursResolved | undefined;
  colors: ReturnType<typeof useThemeColors>;
}) {
  if (!resolved) {
    return (
      <Text style={{ color: colors.textLight }}>
        {label}: <Text style={{ color: colors.textLight }}>загрузка…</Text>
      </Text>
    );
  }
  const offDay = isDayOff(resolved.intervals);
  return (
    <View>
      <Text style={{ color: colors.textLight }}>
        <Text style={{ color: colors.text, fontFamily: "DMSans-SemiBold" }}>{label}: </Text>
        {offDay ? "выходной" : `работает ${formatIntervals(resolved.intervals)}`}
      </Text>
      {resolved.notes ? (
        <Text variant="small" style={{ color: colors.textLight, marginTop: 2 }}>
          {resolved.notes}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  templateCard: {
    padding: 0,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  dowRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  dowLabel: {
    width: 28,
    fontFamily: "DMSans-SemiBold",
  },
  dowValue: {
    flex: 1,
    fontVariant: ["tabular-nums"],
  },
  overridesCard: {
    padding: 0,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  overrideRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  overrideDate: {
    fontFamily: "DMSans-SemiBold",
  },
  previewCard: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
