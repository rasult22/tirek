import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, Body } from "../../components/ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { officeHoursApi } from "../../lib/api/office-hours";
import { useAuthStore } from "../../lib/store/auth-store";
import { hapticLight } from "../../lib/haptics";
import { isDayOff } from "@tirek/shared/office-hours";
import { colors as ds } from "@tirek/shared/design-system";
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
        {/* ── Today / tomorrow preview ──────────────────────────── */}
        <View style={styles.previewRow}>
          <PreviewCard label="Сегодня" resolved={todayResolved} c={c} />
          <PreviewCard label="Завтра" resolved={tomorrowResolved} c={c} />
        </View>

        {/* ── Weekly grid ───────────────────────────────────────── */}
        <Text style={[styles.sectionEyebrow, { color: c.textLight }]}>
          Шаблон недели
        </Text>
        {loadingTemplate ? (
          <View
            style={[
              styles.loadingBox,
              { backgroundColor: c.surface, borderColor: c.borderLight },
            ]}
          >
            <Body style={{ color: c.textLight }}>Загрузка…</Body>
          </View>
        ) : (
          <View style={styles.weekGrid}>
            {([1, 2, 3, 4, 5, 6, 7] as OfficeHoursDayOfWeek[]).map((dow) => {
              const row = templateByDow.get(dow);
              const intervals = row?.intervals ?? [];
              const off = isDayOff(intervals);
              return (
                <Pressable
                  key={dow}
                  onPress={() => {
                    hapticLight();
                    setEditingDow(dow);
                  }}
                  style={({ pressed }) => [
                    styles.dayCell,
                    {
                      backgroundColor: off ? c.surfaceSecondary : c.surface,
                      borderColor: off ? c.borderLight : `${c.primary}26`,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View style={styles.dayCellHeader}>
                    <Text
                      style={[
                        styles.dayCellLabel,
                        { color: off ? c.textLight : c.primaryDark },
                      ]}
                    >
                      {DOW_LABELS[dow]}
                    </Text>
                    <Ionicons
                      name="pencil-outline"
                      size={11}
                      color={c.textLight}
                    />
                  </View>
                  {off ? (
                    <Text
                      style={[styles.dayCellOff, { color: c.textLight }]}
                    >
                      выходной
                    </Text>
                  ) : (
                    <View style={{ gap: 2 }}>
                      {intervals.map((iv, i) => (
                        <Text
                          key={i}
                          style={[styles.dayCellInterval, { color: c.text }]}
                        >
                          {iv.start}–{iv.end}
                        </Text>
                      ))}
                    </View>
                  )}
                  {row?.notes ? (
                    <Text
                      style={[styles.dayCellNotes, { color: c.textLight }]}
                      numberOfLines={1}
                    >
                      {row.notes}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Overrides ─────────────────────────────────────────── */}
        <View style={styles.overridesHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionEyebrow, { color: c.textLight }]}>
              Исключения
            </Text>
            <Text style={[styles.sectionSubtitle, { color: c.textLight }]}>
              Ближайшие 4 недели
            </Text>
          </View>
          <Pressable
            onPress={() => {
              hapticLight();
              setOverrideMode({ kind: "create" });
            }}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: c.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons name="add" size={14} color="#FFF" />
            <Text style={styles.addBtnText}>Добавить</Text>
          </Pressable>
        </View>

        {sortedOverrides.length === 0 ? (
          <View
            style={[
              styles.emptyOverrides,
              { backgroundColor: c.surface, borderColor: c.borderLight },
            ]}
          >
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={c.textLight}
              />
            </View>
            <Body style={{ color: c.textLight, marginTop: 6 }}>
              Исключений нет
            </Body>
          </View>
        ) : (
          <View
            style={[
              styles.overridesList,
              { backgroundColor: c.surface, borderColor: c.borderLight },
            ]}
          >
            {sortedOverrides.map((ov: OfficeHoursOverrideEntry, i) => {
              const off = isDayOff(ov.intervals);
              return (
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
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_600SemiBold",
                        color: c.text,
                      }}
                    >
                      {formatHumanDate(ov.date)}
                    </Text>
                    <Text
                      style={[
                        styles.overrideMeta,
                        {
                          color: c.textLight,
                          fontStyle: off ? "italic" : "normal",
                        },
                      ]}
                    >
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
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Ionicons name="close" size={16} color={c.textLight} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

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

function PreviewCard({
  label,
  resolved,
  c,
}: {
  label: string;
  resolved: OfficeHoursResolved | undefined;
  c: ReturnType<typeof useThemeColors>;
}) {
  const off = resolved ? isDayOff(resolved.intervals) : false;
  return (
    <View
      style={[
        styles.previewCard,
        {
          backgroundColor: !resolved
            ? c.surface
            : off
              ? c.surfaceSecondary
              : ds.brandSoft,
          borderColor: !resolved
            ? c.borderLight
            : off
              ? c.borderLight
              : `${c.primary}26`,
        },
      ]}
    >
      <Text
        style={[styles.previewLabel, { color: c.textLight }]}
      >
        {label}
      </Text>
      {!resolved ? (
        <Text
          style={{
            fontSize: 13,
            color: c.textLight,
            marginTop: 4,
          }}
        >
          загрузка…
        </Text>
      ) : off ? (
        <Text
          style={{
            fontSize: 13,
            color: c.textLight,
            fontStyle: "italic",
            marginTop: 4,
          }}
        >
          выходной
        </Text>
      ) : (
        <Text
          style={{
            fontSize: 16,
            lineHeight: 22,
            fontFamily: "Inter_700Bold",
            color: c.text,
            marginTop: 4,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatIntervals(resolved.intervals)}
        </Text>
      )}
      {resolved?.notes ? (
        <Text
          style={{
            fontSize: 11,
            lineHeight: 14,
            color: c.textLight,
            fontStyle: "italic",
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {resolved.notes}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing["3xl"],
    gap: spacing.md,
  },
  previewRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  previewCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Inter_600SemiBold",
  },
  sectionEyebrow: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Inter_600SemiBold",
    marginTop: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  loadingBox: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  weekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dayCell: {
    width: "47.5%",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 76,
  },
  dayCellHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dayCellLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  dayCellOff: {
    fontSize: 12,
    fontStyle: "italic",
  },
  dayCellInterval: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  dayCellNotes: {
    fontSize: 10,
    lineHeight: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  overridesHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#FFF",
  },
  emptyOverrides: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  overridesList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  overrideRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  overrideMeta: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
