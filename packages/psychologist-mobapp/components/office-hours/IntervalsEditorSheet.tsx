import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
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
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["75%", "92%"], []);

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
      ref.current?.present();
    } else {
      ref.current?.dismiss();
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

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      index={0}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: c.surface }}
      handleIndicatorStyle={{ backgroundColor: c.borderLight }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enablePanDownToClose
    >
      <View style={styles.headerRow}>
        <Text
          style={{
            fontSize: 18,
            lineHeight: 24,
            fontFamily: "Inter_700Bold",
            color: c.text,
            flex: 1,
          }}
        >
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: c.surfaceSecondary },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="close" size={18} color={c.textLight} />
        </Pressable>
      </View>

      <BottomSheetScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {showDayOffToggle ? (
          <View
            style={[
              styles.dayOffRow,
              {
                backgroundColor: c.surfaceSecondary,
                borderColor: c.borderLight,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_600SemiBold",
                color: c.text,
                flex: 1,
              }}
            >
              Выходной
            </Text>
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
          <>
            <Text style={[styles.label, { color: c.textLight }]}>
              Интервалы
            </Text>
            <View style={{ gap: spacing.sm }}>
              {intervals.map((iv, idx) => (
                <View key={idx} style={styles.intervalRow}>
                  <BottomSheetTextInput
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
                  <BottomSheetTextInput
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

        <Text style={[styles.label, { color: c.textLight, marginTop: spacing.lg }]}>
          Заметка (необязательно)
        </Text>
        <BottomSheetTextInput
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
      </BottomSheetScrollView>

      <View style={[styles.footer, { borderTopColor: c.borderLight }]}>
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
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  bodyContent: {
    paddingBottom: spacing.lg,
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
