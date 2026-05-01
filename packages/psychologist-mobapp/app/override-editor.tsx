import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, Button } from "../components/ui";
import { useThemeColors, radius, spacing } from "../lib/theme";
import { hapticLight } from "../lib/haptics";
import { officeHoursApi } from "../lib/api/office-hours";
import { validateIntervals } from "@tirek/shared/office-hours";
import { colors as ds } from "@tirek/shared/design-system";
import type { OfficeHoursInterval } from "@tirek/shared";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

function todayIso(): string {
  const d = new Date();
  const a = new Date(d.getTime() + ALMATY_OFFSET_MS);
  return `${a.getUTCFullYear()}-${String(a.getUTCMonth() + 1).padStart(2, "0")}-${String(a.getUTCDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((v) => Number.parseInt(v, 10));
  const utc = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

export default function OverrideEditorModal() {
  const c = useThemeColors();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ date?: string }>();

  const fixedDate =
    params.date && DATE_RE.test(params.date) ? params.date : undefined;

  const today = todayIso();
  const overrideRangeFrom = today;
  const overrideRangeTo = addDaysIso(today, 28);

  const { data: overrides } = useQuery({
    queryKey: ["office-hours-overrides", overrideRangeFrom, overrideRangeTo],
    queryFn: () =>
      officeHoursApi.getOverrides(overrideRangeFrom, overrideRangeTo),
    enabled: fixedDate != null,
  });

  const existing = fixedDate
    ? overrides?.find((o) => o.date === fixedDate)
    : undefined;
  const initialIntervals = existing?.intervals ?? [];
  const initialNotes = existing?.notes ?? null;

  const [date, setDate] = useState(fixedDate ?? todayIso());
  const [dayOff, setDayOff] = useState(initialIntervals.length === 0);
  const [intervals, setIntervals] = useState<OfficeHoursInterval[]>(
    initialIntervals.length > 0
      ? initialIntervals
      : [{ start: "09:00", end: "17:00" }],
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: ({
      date: d,
      intervals: ivs,
      notes: ns,
    }: {
      date: string;
      intervals: OfficeHoursInterval[];
      notes: string | null;
    }) => officeHoursApi.upsertOverrideDay(d, ivs, ns),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-overrides"] });
      qc.invalidateQueries({ queryKey: ["office-hours-resolve"] });
      router.dismiss();
    },
  });

  function updateInterval(idx: number, field: "start" | "end", value: string) {
    setIntervals((arr) =>
      arr.map((iv, i) => (i === idx ? { ...iv, [field]: value } : iv)),
    );
    setError(null);
  }

  function handleSave() {
    if (!DATE_RE.test(date)) {
      setError("Дата должна быть в формате YYYY-MM-DD");
      return;
    }
    const finalIntervals = dayOff ? [] : intervals;
    const result = validateIntervals(finalIntervals);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    const trimmed = notes.trim();
    mut.mutate({
      date,
      intervals: finalIntervals,
      notes: trimmed.length > 0 ? trimmed : null,
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>
          {fixedDate ? "Исключение" : "Новое исключение"}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.label, { color: c.textLight }]}>Дата</Text>
        {fixedDate ? (
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: c.text,
              marginBottom: spacing.lg,
            }}
          >
            {fixedDate}
          </Text>
        ) : (
          <>
            <TextInput
              value={date}
              onChangeText={(v) => {
                setDate(v);
                setError(null);
              }}
              placeholder="2026-04-30"
              placeholderTextColor={c.textLight}
              style={[
                styles.input,
                {
                  borderColor: c.borderLight,
                  color: c.text,
                  backgroundColor: c.bg,
                },
              ]}
              maxLength={10}
            />
            <View style={styles.quickRow}>
              {(
                [
                  { label: "Сегодня", days: 0 },
                  { label: "Завтра", days: 1 },
                  { label: "+7 дней", days: 7 },
                ] as const
              ).map(({ label, days }) => {
                const target = addDaysIso(todayIso(), days);
                const active = date === target;
                return (
                  <Pressable
                    key={label}
                    onPress={() => {
                      hapticLight();
                      setDate(target);
                      setError(null);
                    }}
                    style={[
                      styles.quickChip,
                      active
                        ? {
                            backgroundColor: ds.brandSoft,
                            borderColor: `${c.primary}33`,
                          }
                        : {
                            backgroundColor: c.surfaceSecondary,
                            borderColor: c.borderLight,
                          },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_600SemiBold",
                        color: active ? c.primaryDark : c.textLight,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View
          style={[
            styles.dayOffRow,
            {
              backgroundColor: c.surfaceSecondary,
              borderColor: c.borderLight,
            },
          ]}
        >
          <Text style={[styles.dayOffLabel, { color: c.text }]}>Выходной</Text>
          <Switch
            value={dayOff}
            onValueChange={(v) => {
              hapticLight();
              setDayOff(v);
              setError(null);
            }}
          />
        </View>

        {!dayOff ? (
          <>
            <Text
              style={[
                styles.label,
                { color: c.textLight, marginTop: spacing.lg },
              ]}
            >
              Интервалы
            </Text>
            <View style={{ gap: spacing.sm }}>
              {intervals.map((iv, idx) => (
                <View key={idx} style={styles.intervalRow}>
                  <TextInput
                    value={iv.start}
                    onChangeText={(v) => updateInterval(idx, "start", v)}
                    placeholder="09:00"
                    placeholderTextColor={c.textLight}
                    style={[
                      styles.input,
                      {
                        borderColor: c.borderLight,
                        color: c.text,
                        backgroundColor: c.bg,
                        flex: 1,
                      },
                    ]}
                    maxLength={5}
                  />
                  <Text style={{ color: c.textLight }}>—</Text>
                  <TextInput
                    value={iv.end}
                    onChangeText={(v) => updateInterval(idx, "end", v)}
                    placeholder="17:00"
                    placeholderTextColor={c.textLight}
                    style={[
                      styles.input,
                      {
                        borderColor: c.borderLight,
                        color: c.text,
                        backgroundColor: c.bg,
                        flex: 1,
                      },
                    ]}
                    maxLength={5}
                  />
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setIntervals((arr) => arr.filter((_, i) => i !== idx));
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={c.textLight}
                    />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() => {
                  hapticLight();
                  setIntervals((arr) => [
                    ...arr,
                    { start: "09:00", end: "12:00" },
                  ]);
                }}
                style={({ pressed }) => [
                  styles.addRow,
                  { borderColor: `${c.primary}33` },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={c.primary}
                />
                <Text
                  style={{
                    color: c.primary,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                  }}
                >
                  Добавить интервал
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        <Text
          style={[
            styles.label,
            { color: c.textLight, marginTop: spacing.lg },
          ]}
        >
          Заметка (необязательно)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="напр. конференция"
          placeholderTextColor={c.textLight}
          style={[
            styles.notesInput,
            {
              borderColor: c.borderLight,
              color: c.text,
              backgroundColor: c.bg,
            },
          ]}
        />

        {error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: `${c.danger}14`,
                borderColor: `${c.danger}33`,
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={c.danger}
            />
            <Text style={{ fontSize: 13, color: c.danger, flex: 1 }}>
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { borderTopColor: c.borderLight }]}>
        <Button
          title="Отмена"
          variant="secondary"
          onPress={() => router.dismiss()}
          style={{ flex: 1 }}
        />
        <Button
          title="Сохранить"
          variant="primary"
          onPress={handleSave}
          loading={mut.isPending}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  headerRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "Inter_700Bold",
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  dayOffLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayOffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 44,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
});
