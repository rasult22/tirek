import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../../lib/hooks/useLanguage";
import { Text } from "../../../components/ui";
import { SkeletonList } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { useThemeColors, spacing, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import { appointmentsApi } from "../../../lib/api/appointments";
import { hapticLight } from "../../../lib/haptics";

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

export default function SlotsScreen() {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:45");
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const weekFrom = fmt(weekDates[0]!);
  const weekTo = fmt(weekDates[6]!);

  const { data: slots, isLoading, isError, refetch } = useQuery({
    queryKey: ["appointment-slots", weekFrom, weekTo],
    queryFn: () => appointmentsApi.getSlots(weekFrom, weekTo),
  });

  const createMutation = useMutation({
    mutationFn: (newSlots: Array<{ date: string; startTime: string; endTime: string }>) =>
      appointmentsApi.createSlots(newSlots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-slots"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.deleteSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-slots"] });
    },
  });

  const slotsForDate = slots?.filter((s) => s.date === selectedDate) ?? [];

  function handleAddSlot() {
    hapticLight();
    createMutation.mutate([{ date: selectedDate, startTime, endTime }]);
  }

  function handleRepeatWeekly() {
    const todaySlots = slotsForDate.filter((s) => !s.isBooked);
    if (!todaySlots.length) return;

    const newSlots: Array<{ date: string; startTime: string; endTime: string }> = [];
    for (let w = 1; w <= repeatWeeks; w++) {
      for (const slot of todaySlots) {
        const d = new Date(slot.date);
        d.setDate(d.getDate() + 7 * w);
        newSlots.push({
          date: fmt(d),
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    }
    if (newSlots.length) {
      hapticLight();
      createMutation.mutate(newSlots);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["appointment-slots"] });
    setRefreshing(false);
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
          <ErrorState onRetry={() => refetch()} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <ConfirmDialog
        open={deleteSlotId !== null}
        onConfirm={() => {
          if (deleteSlotId) deleteMutation.mutate(deleteSlotId);
          setDeleteSlotId(null);
        }}
        onCancel={() => setDeleteSlotId(null)}
        title={t.appointments.deleteSlotConfirm}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1">{t.appointments.slotsManagement}</Text>
        </View>

        {/* Week navigation */}
        <View style={styles.weekNav}>
          <Text variant="h3" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            {t.appointments.selectDate}
          </Text>
          <View style={styles.weekArrows}>
            <Pressable
              onPress={() => setWeekOffset((o) => o - 1)}
              style={styles.arrowBtn}
            >
              <Ionicons name="chevron-back" size={18} color={c.text} />
            </Pressable>
            <Pressable
              onPress={() => setWeekOffset((o) => o + 1)}
              style={styles.arrowBtn}
            >
              <Ionicons name="chevron-forward" size={18} color={c.text} />
            </Pressable>
          </View>
        </View>

        {/* Week date strip */}
        <View style={styles.weekStrip}>
          {weekDates.map((d) => {
            const ds = fmt(d);
            const isSelected = ds === selectedDate;
            const isToday = ds === fmt(new Date());
            const daySlotCount = slots?.filter((s) => s.date === ds).length ?? 0;

            return (
              <Pressable
                key={ds}
                onPress={() => {
                  hapticLight();
                  setSelectedDate(ds);
                }}
                style={[
                  styles.dateButton,
                  isSelected
                    ? { backgroundColor: c.primary }
                    : isToday
                      ? { backgroundColor: `${c.primary}1A` }
                      : { backgroundColor: c.surface },
                  shadow(isSelected ? 2 : 1),
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "DMSans-Medium",
                    color: isSelected ? "rgba(255,255,255,0.7)" : c.textLight,
                  }}
                >
                  {t.mood.weekdays[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "DMSans-Bold",
                    color: isSelected ? "#FFF" : isToday ? c.primary : c.text,
                  }}
                >
                  {d.getDate()}
                </Text>
                {daySlotCount > 0 && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: isSelected ? "rgba(255,255,255,0.6)" : c.textLight,
                    }}
                  >
                    {daySlotCount}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Add slot form */}
        <View style={[styles.formCard, { backgroundColor: c.surface }, shadow(1)]}>
          <Text variant="h3" style={{ marginBottom: 10 }}>
            {t.appointments.addSlots}
          </Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInputWrap}>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor={c.textLight}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={[
                  styles.timeInput,
                  { backgroundColor: c.bg, borderColor: c.borderLight, color: c.text },
                ]}
              />
            </View>
            <Text style={{ color: c.textLight, paddingBottom: 4 }}>–</Text>
            <View style={styles.timeInputWrap}>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="09:45"
                placeholderTextColor={c.textLight}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={[
                  styles.timeInput,
                  { backgroundColor: c.bg, borderColor: c.borderLight, color: c.text },
                ]}
              />
            </View>
            <Pressable
              onPress={handleAddSlot}
              disabled={createMutation.isPending}
              style={[
                styles.addButton,
                { backgroundColor: c.primary },
                createMutation.isPending && { opacity: 0.5 },
              ]}
            >
              {createMutation.isPending ? (
                <Ionicons name="hourglass-outline" size={18} color="#FFF" />
              ) : (
                <Ionicons name="add" size={20} color="#FFF" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Slots list */}
        {isLoading ? (
          <SkeletonList count={3} />
        ) : slotsForDate.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={36} color={`${c.textLight}60`} />
            <Text variant="bodyLight">{t.appointments.noSlots}</Text>
          </View>
        ) : (
          <View style={styles.slotsList}>
            {slotsForDate.map((slot) => (
              <View
                key={slot.id}
                style={[styles.slotCard, { backgroundColor: c.surface }, shadow(1)]}
              >
                <View style={styles.slotInfo}>
                  <Ionicons name="time-outline" size={16} color={c.primary} />
                  <Text style={{ fontSize: 14, fontFamily: "DMSans-Bold", color: c.text }}>
                    {slot.startTime}–{slot.endTime}
                  </Text>
                  <View
                    style={[
                      styles.slotStatusBadge,
                      {
                        backgroundColor: slot.isBooked ? "#FEF3C7" : "#D1FAE5",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "DMSans-Bold",
                        color: slot.isBooked ? "#92400E" : "#065F46",
                      }}
                    >
                      {slot.isBooked ? t.appointments.booked : t.appointments.available}
                    </Text>
                  </View>
                </View>
                {!slot.isBooked && (
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setDeleteSlotId(slot.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Repeat weekly */}
        {slotsForDate.filter((s) => !s.isBooked).length > 0 && (
          <View style={[styles.repeatCard, { backgroundColor: c.surfaceSecondary }]}>
            <View style={styles.repeatRow}>
              <Ionicons name="copy-outline" size={16} color={c.textLight} />
              <Text style={{ fontSize: 13, color: c.text }}>
                {t.appointments.repeatWeekly}:
              </Text>
              <TextInput
                value={String(repeatWeeks)}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  if (!isNaN(n) && n >= 1 && n <= 8) setRepeatWeeks(n);
                }}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.repeatInput,
                  { borderColor: c.borderLight, color: c.text, backgroundColor: c.surface },
                ]}
              />
              <Text variant="caption">{t.appointments.weeks}</Text>
            </View>
            <Pressable
              onPress={handleRepeatWeekly}
              disabled={createMutation.isPending}
              style={[
                styles.repeatButton,
                { backgroundColor: c.primary },
                createMutation.isPending && { opacity: 0.5 },
              ]}
            >
              <Ionicons name="copy-outline" size={12} color="#FFF" />
              <Text style={{ fontSize: 12, fontFamily: "DMSans-Bold", color: "#FFF" }}>
                {t.appointments.repeatWeekly}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  weekArrows: {
    flexDirection: "row",
    gap: 4,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  weekStrip: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 4,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  formCard: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: radius.lg,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  timeInputWrap: {
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    textAlign: "center",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  slotsList: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  slotInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  slotStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: radius.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  repeatCard: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: radius.lg,
    gap: 10,
  },
  repeatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  repeatInput: {
    width: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    textAlign: "center",
  },
  repeatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
});
