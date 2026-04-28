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

export interface IntervalsEditorSheetProps {
  open: boolean;
  title: string;
  initialIntervals: OfficeHoursInterval[];
  initialNotes: string | null;
  showDayOffToggle?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (intervals: OfficeHoursInterval[], notes: string | null) => void;
}

export function IntervalsEditorSheet({
  open,
  title,
  initialIntervals,
  initialNotes,
  showDayOffToggle = true,
  saving = false,
  onClose,
  onSave,
}: IntervalsEditorSheetProps) {
  const c = useThemeColors();
  const [dayOff, setDayOff] = useState(initialIntervals.length === 0);
  const [intervals, setIntervals] = useState<OfficeHoursInterval[]>(
    initialIntervals.length > 0 ? initialIntervals : [{ start: "09:00", end: "17:00" }],
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDayOff(initialIntervals.length === 0);
      setIntervals(
        initialIntervals.length > 0
          ? initialIntervals
          : [{ start: "09:00", end: "17:00" }],
      );
      setNotes(initialNotes ?? "");
      setError(null);
    }
  }, [open, initialIntervals, initialNotes]);

  function updateInterval(idx: number, field: "start" | "end", value: string) {
    setIntervals((arr) => arr.map((iv, i) => (i === idx ? { ...iv, [field]: value } : iv)));
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
    onSave(finalIntervals, trimmed.length > 0 ? trimmed : null);
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
            <Text variant="h3">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={c.textLight} />
            </Pressable>
          </View>

          {showDayOffToggle ? (
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
          ) : null}

          {!dayOff ? (
            <ScrollView
              style={{ maxHeight: 280 }}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {intervals.map((iv, idx) => (
                <View key={idx} style={styles.intervalRow}>
                  <TextInput
                    value={iv.start}
                    onChangeText={(v) => updateInterval(idx, "start", v)}
                    placeholder="09:00"
                    placeholderTextColor={c.textLight}
                    style={[styles.input, { borderColor: c.border, color: c.text }]}
                    maxLength={5}
                  />
                  <Text style={{ color: c.textLight }}>—</Text>
                  <TextInput
                    value={iv.end}
                    onChangeText={(v) => updateInterval(idx, "end", v)}
                    placeholder="17:00"
                    placeholderTextColor={c.textLight}
                    style={[styles.input, { borderColor: c.border, color: c.text }]}
                    maxLength={5}
                  />
                  <Pressable
                    onPress={() => removeInterval(idx)}
                    hitSlop={8}
                    style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="trash-outline" size={20} color={c.textLight} />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addInterval} style={styles.addRow}>
                <Ionicons name="add-circle-outline" size={20} color={c.primary} />
                <Text style={{ color: c.primary }}>Добавить интервал</Text>
              </Pressable>
            </ScrollView>
          ) : null}

          <Text variant="caption" style={styles.notesLabel}>
            Заметка (необязательно)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="напр. конференция"
            placeholderTextColor={c.textLight}
            style={[
              styles.notesInput,
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
  dayOffRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 8,
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
    fontVariant: ["tabular-nums"],
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  notesLabel: { marginTop: 16, marginBottom: 6 },
  notesInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  error: {
    marginTop: 12,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
});
