import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../../lib/hooks/useLanguage";
import { Text, Button } from "../../../components/ui";
import { SkeletonList } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { useThemeColors, spacing, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import { appointmentsApi } from "../../../lib/api/appointments";
import { hapticLight } from "../../../lib/haptics";
import type { Appointment } from "@tirek/shared";

const statusColors: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#E5E7EB", text: "#6B7280" },
  completed: { bg: "#DBEAFE", text: "#1E40AF" },
};

export default function AppointmentsScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");
  const [cancelApptId, setCancelApptId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["psychologist-appointments"],
    queryFn: () => appointmentsApi.list(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["psychologist-appointments"] });
    },
  });

  const appointments = data?.data ?? [];
  const filtered =
    tab === "upcoming"
      ? appointments.filter(
          (a) => a.status === "scheduled" || a.status === "confirmed",
        )
      : appointments;

  function getStatusLabel(status: string) {
    switch (status) {
      case "scheduled": return t.appointments.scheduled;
      case "confirmed": return t.appointments.confirmed;
      case "completed": return t.appointments.completed;
      case "cancelled": return t.appointments.cancelledStatus;
      default: return status;
    }
  }

  function handleStatusChange(id: string, status: string) {
    hapticLight();
    if (status === "cancel-request") {
      setCancelApptId(id);
    } else {
      statusMutation.mutate({ id, status });
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["psychologist-appointments"] });
    setRefreshing(false);
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <ConfirmDialog
        open={cancelApptId !== null}
        onConfirm={() => {
          if (cancelApptId) statusMutation.mutate({ id: cancelApptId, status: "cancelled" });
          setCancelApptId(null);
        }}
        onCancel={() => setCancelApptId(null)}
        title={t.appointments.cancelConfirm}
        confirmLabel={t.appointments.cancel}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1" style={{ flex: 1 }}>{t.appointments.appointments}</Text>
        <Pressable
          onPress={() => {
            hapticLight();
            router.push("/(screens)/appointments/slots");
          }}
          style={[styles.slotsButton, { backgroundColor: c.primary }]}
        >
          <Ionicons name="settings-outline" size={14} color="#FFF" />
          <Text style={{ fontSize: 13, fontFamily: "DMSans-Bold", color: "#FFF" }}>
            {t.appointments.slotsManagement}
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(["upcoming", "all"] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => {
              hapticLight();
              setTab(key);
            }}
            style={[
              styles.tabButton,
              tab === key
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "DMSans-Bold",
                color: tab === key ? "#FFF" : c.textLight,
              }}
            >
              {key === "upcoming" ? t.appointments.upcomingTab : t.appointments.allAppointments}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: `${c.textLight}1A` }]}>
            <Ionicons name="calendar-outline" size={32} color={c.textLight} />
          </View>
          <Text variant="bodyLight">{t.appointments.noAppointments}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
            />
          }
        >
          {filtered.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              c={c}
              getStatusLabel={getStatusLabel}
              onStatusChange={handleStatusChange}
              isPending={statusMutation.isPending}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function AppointmentCard({
  appointment: appt,
  c,
  getStatusLabel,
  onStatusChange,
  isPending,
}: {
  appointment: Appointment;
  c: ReturnType<typeof useThemeColors>;
  getStatusLabel: (s: string) => string;
  onStatusChange: (id: string, status: string) => void;
  isPending: boolean;
}) {
  const t = useT();
  const sc = statusColors[appt.status] ?? { bg: "#E5E7EB", text: "#6B7280" };

  return (
    <View style={[styles.card, { backgroundColor: c.surface }, shadow(1)]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.studentRow}>
            <Ionicons name="person-outline" size={14} color={c.primary} />
            <Text style={{ fontSize: 14, fontFamily: "DMSans-Bold", color: c.text }}>
              {appt.studentName}
            </Text>
            {appt.studentGrade && (
              <Text variant="caption">
                {appt.studentGrade}{appt.studentClassLetter} класс
              </Text>
            )}
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={c.textLight} />
            <Text variant="caption">
              {appt.date} · {appt.startTime}–{appt.endTime}
            </Text>
          </View>
          {appt.studentNote && (
            <Text variant="caption" style={{ marginTop: 6, fontStyle: "italic" }}>
              "{appt.studentNote}"
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={{ fontSize: 10, fontFamily: "DMSans-Bold", color: sc.text }}>
            {getStatusLabel(appt.status)}
          </Text>
        </View>
      </View>

      {(appt.status === "scheduled" || appt.status === "confirmed") && (
        <View style={[styles.actionsRow, { borderTopColor: c.borderLight }]}>
          {appt.status === "scheduled" && (
            <Pressable
              onPress={() => onStatusChange(appt.id, "confirmed")}
              disabled={isPending}
              style={[styles.actionBtn, { backgroundColor: "#D1FAE5" }]}
            >
              <Ionicons name="checkmark" size={12} color="#065F46" />
              <Text style={{ fontSize: 12, fontFamily: "DMSans-Bold", color: "#065F46" }}>
                {t.appointments.confirm}
              </Text>
            </Pressable>
          )}
          {appt.status === "confirmed" && (
            <Pressable
              onPress={() => onStatusChange(appt.id, "completed")}
              disabled={isPending}
              style={[styles.actionBtn, { backgroundColor: "#DBEAFE" }]}
            >
              <Ionicons name="checkmark-circle-outline" size={12} color="#1E40AF" />
              <Text style={{ fontSize: 12, fontFamily: "DMSans-Bold", color: "#1E40AF" }}>
                {t.appointments.complete}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onStatusChange(appt.id, "cancel-request")}
            disabled={isPending}
            style={[styles.actionBtn, { backgroundColor: c.surfaceSecondary }]}
          >
            <Ionicons name="close" size={12} color="#6B7280" />
            <Text style={{ fontSize: 12, fontFamily: "DMSans-Bold", color: "#6B7280" }}>
              {t.appointments.cancel}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  slotsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  card: {
    borderRadius: radius.lg,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
