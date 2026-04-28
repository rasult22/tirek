import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button } from "../ui";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { validateIntervals } from "@tirek/shared/office-hours";
import type { OfficeHoursInterval } from "@tirek/shared";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  const d = new Date();
  const offset = 5 * 60 * 60 * 1000; // Almaty UTC+5
  const a = new Date(d.getTime() + offset);
  return `${a.getUTCFullYear()}-${String(a.getUTCMonth() + 1).padStart(2, "0")}-${String(a.getUTCDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((v) => Number.parseInt(v, 10));
  const utc = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

export interface OverrideEditorSheetProps {
  open: boolean;
  /** Если задан — режим редактирования: дата фиксирована, нельзя менять. */
  fixedDate?: string;
  initialIntervals: OfficeHoursInterval[];
  initialNotes: string | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (date: string, intervals: OfficeHoursInterval[], notes: string | null) => void;
}

export function OverrideEditorSheet({
  open,
  fixedDate,
  initialIntervals,
  initialNotes,
  saving = false,
  onClose,
  onSave,
}: OverrideEditorSheetProps) {
  const c = useThemeColors();
  const [date, setDate] = useState(fixedDate ?? todayIso());
  const [dayOff, setDayOff] = useState(initialIntervals.length === 0);
  const [intervals, setIntervals] = useState<OfficeHoursInterval[]>(
    initialIntervals.length > 0 ? initialIntervals : [{ start: "09:00", end: "17:00" }],
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(fixedDate ?? todayIso());
      setDayOff(initialIntervals.length === 0);
      setIntervals(
        initialIntervals.length > 0
          ? initialIntervals
          : [{ start: "09:00", end: "17:00" }],
      );
      setNotes(initialNotes ?? "");
      setError(null);
    }
  }, [open, fixedDate, initialIntervals, initialNotes]);

  function updateInterval(idx: number, field: "start" | "end", value: string) {
    setIntervals((arr) => arr.map((iv, i) => (i === idx ? { ...iv, [field]: value } : iv)));
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
    onSave(date, finalIntervals, trimmed.length > 0 ? trimmed : null);
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.surface }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: c.borderLight }]} />
          </View>

          <View style={styles.headerRow}>
            <Text variant="h3">{fixedDate ? "Исключение" : "Новое исключение"}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={c.textLight} />
            </Pressable>
          </View>

          <Text variant="caption" style={styles.label}>
            Дата
          </Text>
          {fixedDate ? (
            <Text style={{ color: c.text, marginBottom: 8 }}>{fixedDate}</Text>
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
                  { borderColor: c.border, color: c.text, backgroundColor: c.surfaceSecondary },
                ]}
                maxLength={10}
              />
              <View style={styles.quickRow}>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setDate(todayIso());
                    setError(null);
                  }}
                  style={[styles.quickChip, { backgroundColor: c.surfaceSecondary }]}
                >
                  <Text variant="small" style={{ color: c.textLight }}>
                    Сегодня
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setDate(addDaysIso(todayIso(), 1));
                    setError(null);
                  }}
                  style={[styles.quickChip, { backgroundColor: c.surfaceSecondary }]}
                >
                  <Text variant="small" style={{ color: c.textLight }}>
                    Завтра
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setDate(addDaysIso(todayIso(), 7));
                    setError(null);
                  }}
                  style={[styles.quickChip, { backgroundColor: c.surfaceSecondary }]}
                >
                  <Text variant="small" style={{ color: c.textLight }}>
                    +7 дней
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={styles.dayOffRow}>
            <Text>Выходной</Text>
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
            <ScrollView
              style={{ maxHeight: 220 }}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {intervals.map((iv, idx) => (
                <View key={idx} style={styles.intervalRow}>
                  <TextInput
                    value={iv.start}
                    onChangeText={(v) => updateInterval(idx, "start", v)}
                    placeholder="09:00"
                    placeholderTextColor={c.textLight}
                    style={[styles.input, { borderColor: c.border, color: c.text, flex: 1 }]}
                    maxLength={5}
                  />
                  <Text style={{ color: c.textLight }}>—</Text>
                  <TextInput
                    value={iv.end}
                    onChangeText={(v) => updateInterval(idx, "end", v)}
                    placeholder="17:00"
                    placeholderTextColor={c.textLight}
                    style={[styles.input, { borderColor: c.border, color: c.text, flex: 1 }]}
                    maxLength={5}
                  />
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setIntervals((arr) => arr.filter((_, i) => i !== idx));
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={20} color={c.textLight} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() => {
                  hapticLight();
                  setIntervals((arr) => [...arr, { start: "09:00", end: "12:00" }]);
                }}
                style={styles.addRow}
              >
                <Ionicons name="add-circle-outline" size={20} color={c.primary} />
                <Text style={{ color: c.primary }}>Добавить интервал</Text>
              </Pressable>
            </ScrollView>
          ) : null}

          <Text variant="caption" style={styles.label}>
            Заметка (необязательно)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="напр. конференция"
            placeholderTextColor={c.textLight}
            style={[
              styles.input,
              { borderColor: c.border, color: c.text, backgroundColor: c.surfaceSecondary },
            ]}
          />

          {error ? (
            <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              title="Отмена"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Сохранить"
              variant="primary"
              onPress={handleSave}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  handleWrap: { alignItems: "center", paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  quickRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dayOffRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  error: { marginTop: 12, fontSize: 13 },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
});
