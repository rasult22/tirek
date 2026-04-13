import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../lib/hooks/useLanguage";
import { appointmentsApi } from "../../lib/api/appointments";
import { ErrorState } from "../../components/ErrorState";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Text, Button } from "../../components/ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { Skeleton } from "../../components/Skeleton";
import type { AppointmentSlot } from "@tirek/shared";

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

const statusColors: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#E5E7EB", text: "#6B7280" },
  completed: { bg: "#DBEAFE", text: "#1E40AF" },
};

export default function AppointmentsScreen() {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [bookingSlot, setBookingSlot] = useState<AppointmentSlot | null>(null);
  const [note, setNote] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const weekFrom = fmt(weekDates[0]!);
  const weekTo = fmt(weekDates[6]!);

  const { data: slots, isLoading: slotsLoading, isError, refetch } = useQuery({
    queryKey: ["available-slots", weekFrom, weekTo],
    queryFn: () => appointmentsApi.availableSlots(weekFrom, weekTo),
  });

  const { data: myAppointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: appointmentsApi.list,
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.book(bookingSlot!.id, note.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "next"] });
      setBookingSlot(null);
      setNote("");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "next"] });
      setCancelId(null);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const slotsForDate = slots?.filter((s) => s.date === selectedDate) ?? [];
  const upcoming =
    myAppointments?.data?.filter(
      (a) => a.status === "scheduled" || a.status === "confirmed",
    ) ?? [];

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        <Text variant="h2">{t.appointments.title}</Text>

        {/* Upcoming appointments */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textLight }]}>{t.appointments.upcoming}</Text>
            {upcoming.map((appt) => {
              const sc = statusColors[appt.status] ?? statusColors.scheduled;
              return (
                <View key={appt.id} style={[styles.apptCard, { backgroundColor: c.surface }]}>
                  <View style={styles.apptInfo}>
                    <View style={styles.apptTimeRow}>
                      <Ionicons name="time-outline" size={14} color={c.primary} />
                      <Text style={[styles.apptTimeText, { color: c.text }]}>
                        {appt.date} · {appt.startTime}–{appt.endTime}
                      </Text>
                    </View>
                    <Text style={[styles.apptPsych, { color: c.textLight }]}>{appt.psychologistName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusText, { color: sc.text }]}>
                        {t.appointments[appt.status as "scheduled" | "confirmed"]}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setCancelId(appt.id)}
                    style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Week date strip */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textLight }]}>{t.appointments.availableSlots}</Text>
            <View style={styles.weekNav}>
              <Pressable
                onPress={() => setWeekOffset((o) => o - 1)}
                style={({ pressed }) => [styles.weekNavBtn, pressed && styles.pressed]}
              >
                <Ionicons name="chevron-back" size={16} color={c.text} />
              </Pressable>
              <Pressable
                onPress={() => setWeekOffset((o) => o + 1)}
                style={({ pressed }) => [styles.weekNavBtn, pressed && styles.pressed]}
              >
                <Ionicons name="chevron-forward" size={16} color={c.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.dateStrip}>
            {weekDates.map((d) => {
              const ds = fmt(d);
              const isSelected = ds === selectedDate;
              const isToday = ds === fmt(new Date());
              const daySlots = slots?.filter((s) => s.date === ds).length ?? 0;
              const weekdayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;

              return (
                <Pressable
                  key={ds}
                  onPress={() => setSelectedDate(ds)}
                  style={[
                    styles.dateItem,
                    isSelected && [styles.dateItemSelected, { backgroundColor: c.primary }],
                    !isSelected && isToday && { backgroundColor: `${c.primary}15` },
                    !isSelected && !isToday && [styles.dateItemDefault, { backgroundColor: c.surface }],
                  ]}
                >
                  <Text
                    style={[
                      styles.dateWeekday,
                      { color: c.textLight },
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {t.mood.weekdays[weekdayIdx]}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumber,
                      { color: c.text },
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                  {daySlots > 0 && (
                    <View
                      style={[
                        styles.dateDot,
                        { backgroundColor: c.primary },
                        isSelected && { backgroundColor: c.surface },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Slots for selected date */}
        <View style={styles.slotsSection}>
          {slotsLoading ? (
            <View style={styles.slotsGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="48%" height={48} borderRadius={radius.md} />
              ))}
            </View>
          ) : slotsForDate.length === 0 ? (
            <View style={styles.slotsCenter}>
              <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
              <Text style={[styles.noSlotsText, { color: c.textLight }]}>{t.appointments.noSlots}</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slotsForDate.map((slot) => (
                <Pressable
                  key={slot.id}
                  onPress={() => {
                    setBookingSlot(slot);
                    setNote("");
                  }}
                  style={({ pressed }) => [
                    styles.slotCard,
                    { backgroundColor: c.surface },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="time-outline" size={14} color={c.primary} />
                  <Text style={[styles.slotTime, { color: c.text }]}>
                    {slot.startTime}–{slot.endTime}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={!!bookingSlot}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingSlot(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setBookingSlot(null)}
          />
          <View style={[styles.modalSheet, { backgroundColor: c.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="h3">{t.appointments.book}</Text>
              <Pressable
                onPress={() => setBookingSlot(null)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
            </View>

            {bookingSlot && (
              <View style={[styles.modalSlotInfo, { backgroundColor: `${c.primary}15` }]}>
                <Ionicons name="time" size={14} color={c.primaryDark} />
                <Text style={[styles.modalSlotText, { color: c.primaryDark }]}>
                  {bookingSlot.date} · {bookingSlot.startTime}–{bookingSlot.endTime}
                </Text>
              </View>
            )}

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.appointments.notePlaceholder}
              placeholderTextColor={c.textLight}
              multiline
              numberOfLines={3}
              style={[styles.noteInput, { borderColor: c.borderLight, color: c.text }]}
            />

            <Button
              title={bookMutation.isPending ? "" : t.appointments.book}
              onPress={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              loading={bookMutation.isPending}
            />
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={!!cancelId}
        title={t.appointments.cancel}
        description={t.appointments.cancelConfirm}
        confirmLabel={t.appointments.cancel}
        onConfirm={() => cancelId && cancelMutation.mutate(cancelId)}
        onCancel={() => setCancelId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  weekNav: {
    flexDirection: "row",
    gap: 4,
  },
  weekNavBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  apptCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow(1),
  },
  apptInfo: {
    flex: 1,
  },
  apptTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  apptTimeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  apptPsych: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cancelBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  dateStrip: {
    flexDirection: "row",
    gap: 6,
  },
  dateItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  dateItemSelected: {
    ...shadow(2),
  },
  dateItemDefault: {
    ...shadow(1),
  },
  dateWeekday: {
    fontSize: 10,
    fontWeight: "500",
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateTextSelected: {
    color: "#FFFFFF",
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  slotsSection: {
    marginTop: spacing.lg,
  },
  slotsCenter: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    gap: spacing.sm,
  },
  noSlotsText: {
    fontSize: 14,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "48%",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadow(1),
  },
  slotTime: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  modalSlotInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  modalSlotText: {
    fontSize: 14,
    fontWeight: "700",
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: spacing.lg,
  },
});
