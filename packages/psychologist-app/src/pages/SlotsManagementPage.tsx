import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { appointmentsApi } from "../api/appointments.js";

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

export function SlotsManagementPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:45");
  const [repeatWeeks, setRepeatWeeks] = useState(1);

  const weekFrom = fmt(weekDates[0]!);
  const weekTo = fmt(weekDates[6]!);

  const { data: slots, isLoading } = useQuery({
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
    createMutation.mutate([
      { date: selectedDate, startTime, endTime },
    ]);
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
      createMutation.mutate(newSlots);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h1 className="text-xl font-bold text-text-main">
        {t.appointments.slotsManagement}
      </h1>

      {/* Week date strip */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-light">
            {t.appointments.selectDate}
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
        <div className="flex gap-2">
          {weekDates.map((d) => {
            const ds = fmt(d);
            const isSelected = ds === selectedDate;
            const isToday = ds === fmt(new Date());
            const daySlots = slots?.filter((s) => s.date === ds).length ?? 0;
            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
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
                  <span className="text-[10px] opacity-60">{daySlots}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add slot form */}
      <div className="mt-5 rounded-2xl bg-surface p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-text-main">
          {t.appointments.addSlots}
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-light">
              {t.mood.weekdays[0]} {/* reuse */}
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <span className="pb-2 text-text-light">–</span>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-light">
              &nbsp;
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={handleAddSlot}
            disabled={createMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Slots list for selected date */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : slotsForDate.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-text-light">
              {t.appointments.noSlots}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {slotsForDate.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-primary" />
                  <span className="text-sm font-bold text-text-main">
                    {slot.startTime}–{slot.endTime}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      slot.isBooked
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700"
                    }`}
                  >
                    {slot.isBooked
                      ? t.appointments.booked
                      : t.appointments.available}
                  </span>
                </div>
                {!slot.isBooked && (
                  <button
                    onClick={() => {
                      if (confirm(t.appointments.deleteSlotConfirm)) {
                        deleteMutation.mutate(slot.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-hover hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repeat weekly */}
      {slotsForDate.filter((s) => !s.isBooked).length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-secondary p-4">
          <Copy size={16} className="text-text-light" />
          <span className="text-sm text-text-main">
            {t.appointments.repeatWeekly}:
          </span>
          <input
            type="number"
            min={1}
            max={8}
            value={repeatWeeks}
            onChange={(e) => setRepeatWeeks(Number(e.target.value))}
            className="w-16 rounded-lg border border-border px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm text-text-light">
            {t.appointments.weeks}
          </span>
          <button
            onClick={handleRepeatWeekly}
            disabled={createMutation.isPending}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <Copy size={12} className="mr-1 inline" />
            {t.appointments.repeatWeekly}
          </button>
        </div>
      )}
    </div>
  );
}
