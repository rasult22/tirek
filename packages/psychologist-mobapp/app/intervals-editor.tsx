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
import type {
  OfficeHoursDayOfWeek,
  OfficeHoursInterval,
} from "@tirek/shared";

const DOW_LABELS: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

export default function IntervalsEditorModal() {
  const c = useThemeColors();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ dayOfWeek?: string }>();

  const dayOfWeek = (
    params.dayOfWeek && /^[1-7]$/.test(params.dayOfWeek)
      ? Number(params.dayOfWeek)
      : 1
  ) as OfficeHoursDayOfWeek;

  const { data: template } = useQuery({
    queryKey: ["office-hours-template"],
    queryFn: () => officeHoursApi.getTemplate(),
  });

  const templateRow = template?.find((r) => r.dayOfWeek === dayOfWeek);
  const initialIntervals = templateRow?.intervals ?? [];
  const initialNotes = templateRow?.notes ?? null;

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
      intervals: ivs,
      notes: ns,
    }: {
      intervals: OfficeHoursInterval[];
      notes: string | null;
    }) => officeHoursApi.upsertTemplateDay(dayOfWeek, ivs, ns),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-template"] });
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

  function addInterval() {
    hapticLight();
    setIntervals((arr) => [...arr, { start: "09:00", end: "12:00" }]);
    setError(null);
  }

  function removeInterval(idx: number) {
    hapticLight();
    setIntervals((arr) => arr.filter((_, i) => i !== idx));
    setError(null);
  }

  function handleSave() {
    const finalIntervals = dayOff ? [] : intervals;
    const result = validateIntervals(finalIntervals);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    const trimmed = notes.trim();
    mut.mutate({
      intervals: finalIntervals,
      notes: trimmed.length > 0 ? trimmed : null,
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>
          Шаблон: {DOW_LABELS[dayOfWeek]}
        </Text>
      </View>

      <View style={styles.body}>
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
            <Text style={[styles.label, { color: c.textLight }]}>Интервалы</Text>
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
                      },
                    ]}
                    maxLength={5}
                  />
                  <Pressable
                    onPress={() => removeInterval(idx)}
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
                onPress={addInterval}
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
          style={[styles.label, { color: c.textLight, marginTop: spacing.lg }]}
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
  dayOffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  dayOffLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
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
