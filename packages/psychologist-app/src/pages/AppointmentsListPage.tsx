import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  X,
  CheckCircle2,
  Loader2,
  User,
  Settings,
} from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { appointmentsApi } from "../api/appointments.js";
import type { Appointment } from "@tirek/shared";

const statusColors: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  completed: "bg-blue-100 text-blue-700",
};

export function AppointmentsListPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");

  const { data, isLoading } = useQuery({
    queryKey: ["psychologist-appointments"],
    queryFn: () => appointmentsApi.list(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["psychologist-appointments"],
      });
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
      case "scheduled":
        return t.appointments.scheduled;
      case "confirmed":
        return t.appointments.confirmed;
      case "completed":
        return t.appointments.completed;
      case "cancelled":
        return t.appointments.cancelledStatus;
      default:
        return status;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-main">
          {t.appointments.appointments}
        </h1>
        <Link
          to="/appointments/slots"
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-dark"
        >
          <Settings size={14} />
          {t.appointments.slotsManagement}
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-2">
        {(["upcoming", "all"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              tab === key
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-light hover:bg-gray-200"
            }`}
          >
            {key === "upcoming"
              ? t.appointments.upcomingTab
              : t.appointments.allAppointments}
          </button>
        ))}
      </div>

      {/* Appointments list */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-text-light">
              {t.appointments.noAppointments}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                t={t}
                getStatusLabel={getStatusLabel}
                onStatusChange={(id, status) =>
                  statusMutation.mutate({ id, status })
                }
                isPending={statusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({
  appointment: appt,
  t,
  getStatusLabel,
  onStatusChange,
  isPending,
}: {
  appointment: Appointment;
  t: ReturnType<typeof useT>;
  getStatusLabel: (s: string) => string;
  onStatusChange: (id: string, status: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-primary" />
            <span className="text-sm font-bold text-text-main">
              {appt.studentName}
            </span>
            {appt.studentGrade && (
              <span className="text-xs text-text-light">
                {appt.studentGrade}
                {appt.studentClassLetter} класс
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-light">
            <Calendar size={12} />
            <span>
              {appt.date} &middot; {appt.startTime}–{appt.endTime}
            </span>
          </div>
          {appt.studentNote && (
            <p className="mt-2 text-xs italic text-text-light">
              &ldquo;{appt.studentNote}&rdquo;
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[appt.status] ?? ""}`}
        >
          {getStatusLabel(appt.status)}
        </span>
      </div>

      {/* Action buttons */}
      {(appt.status === "scheduled" || appt.status === "confirmed") && (
        <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
          {appt.status === "scheduled" && (
            <button
              onClick={() => onStatusChange(appt.id, "confirmed")}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-200 disabled:opacity-50"
            >
              <Check size={12} />
              {t.appointments.confirm}
            </button>
          )}
          {appt.status === "confirmed" && (
            <button
              onClick={() => onStatusChange(appt.id, "completed")}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              <CheckCircle2 size={12} />
              {t.appointments.complete}
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(t.appointments.cancelConfirm)) {
                onStatusChange(appt.id, "cancelled");
              }
            }}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            <X size={12} />
            {t.appointments.cancel}
          </button>
        </div>
      )}
    </div>
  );
}
