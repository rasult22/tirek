import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { appointmentsApi } from "../api/appointments.js";
import { AppLayout } from "../components/ui/AppLayout.js";
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

const statusColors: Record<string, string> = {
  scheduled: "bg-amber-100 dark:bg-amber-900/30 text-amber-700",
  confirmed: "bg-green-100 dark:bg-green-900/30 text-green-700",
  cancelled: "bg-surface-secondary text-gray-500",
  completed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
};

export function AppointmentsPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [bookingSlot, setBookingSlot] = useState<AppointmentSlot | null>(null);
  const [note, setNote] = useState("");

  const weekFrom = fmt(weekDates[0]!);
  const weekTo = fmt(weekDates[6]!);

  const { data: slots, isLoading: slotsLoading } = useQuery({
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
    },
  });

  const slotsForDate = slots?.filter((s) => s.date === selectedDate) ?? [];
  const upcoming =
    myAppointments?.data?.filter(
      (a) => a.status === "scheduled" || a.status === "confirmed",
    ) ?? [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 pb-28">
        <h1 className="text-xl font-extrabold text-text-main">
          {t.appointments.title}
        </h1>

        {/* Upcoming appointments */}
        {upcoming.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-light">
              {t.appointments.upcoming}
            </h2>
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      <span className="text-sm font-bold text-text-main">
                        {appt.date} &middot; {appt.startTime}–{appt.endTime}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-text-light">
                      {appt.psychologistName}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[appt.status] ?? ""}`}
                    >
                      {t.appointments[appt.status as "scheduled" | "confirmed"]}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t.appointments.cancelConfirm)) {
                        cancelMutation.mutate(appt.id);
                      }
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-surface-hover hover:text-danger"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week date strip */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-light">
              {t.appointments.availableSlots}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="rounded-lg p-1.5 hover:bg-surface-hover"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                className="rounded-lg p-1.5 hover:bg-surface-hover"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex gap-1.5">
            {weekDates.map((d) => {
              const ds = fmt(d);
              const isSelected = ds === selectedDate;
              const isToday = ds === fmt(new Date());
              const daySlots = slots?.filter((s) => s.date === ds).length ?? 0;
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-md"
                      : isToday
                        ? "bg-primary/10 text-primary-dark"
                        : "bg-surface text-text-main shadow-sm"
                  }`}
                >
                  <span className="text-[10px] font-medium opacity-70">
                    {t.mood.weekdays[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                  </span>
                  <span>{d.getDate()}</span>
                  {daySlots > 0 && (
                    <span
                      className={`h-1 w-1 rounded-full ${isSelected ? "bg-surface" : "bg-primary"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots for selected date */}
        <div className="mt-4">
          {slotsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : slotsForDate.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar
                size={36}
                className="mx-auto mb-2 text-gray-300"
              />
              <p className="text-sm text-text-light">
                {t.appointments.noSlots}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slotsForDate.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => {
                    setBookingSlot(slot);
                    setNote("");
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <Clock size={14} className="text-primary" />
                  <span className="text-sm font-bold text-text-main">
                    {slot.startTime}–{slot.endTime}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Booking modal */}
        {bookingSlot && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
            <div className="w-full max-w-md rounded-t-3xl bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main">
                  {t.appointments.book}
                </h3>
                <button
                  onClick={() => setBookingSlot(null)}
                  className="rounded-lg p-1 hover:bg-surface-hover"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary-dark">
                <Clock size={14} className="mr-2 inline" />
                {bookingSlot.date} &middot; {bookingSlot.startTime}–
                {bookingSlot.endTime}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.appointments.notePlaceholder}
                rows={3}
                className="mb-4 w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => bookMutation.mutate()}
                disabled={bookMutation.isPending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {bookMutation.isPending ? (
                  <Loader2
                    size={16}
                    className="mx-auto animate-spin"
                  />
                ) : (
                  t.appointments.book
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
