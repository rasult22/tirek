import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import type { OfficeHoursInterval } from "@tirek/shared";
import { useT } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { officeHoursApi } from "../api/office-hours.js";
import { ErrorState } from "../components/ui/ErrorState.js";

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function todayIsoAlmaty(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function validateLocal(intervals: OfficeHoursInterval[]): string | null {
  for (const { start, end } of intervals) {
    if (!HHMM_RE.test(start) || !HHMM_RE.test(end)) return "format";
    if (start >= end) return "order";
  }
  const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.start < sorted[i - 1]!.end) return "overlap";
  }
  return null;
}

export function OfficeHoursPage() {
  const t = useT();
  const psychologistId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const [date, setDate] = useState(todayIsoAlmaty());
  const [intervals, setIntervals] = useState<OfficeHoursInterval[]>([]);
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["office-hours", psychologistId, date],
    queryFn: () =>
      psychologistId ? officeHoursApi.getByDate(psychologistId, date) : null,
    enabled: !!psychologistId,
  });

  useEffect(() => {
    if (!touched) {
      setIntervals(data?.intervals ?? []);
      setNotes(data?.notes ?? "");
    }
  }, [data, touched]);

  const upsert = useMutation({
    mutationFn: () =>
      officeHoursApi.upsert(date, intervals, notes.trim() || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-hours"] });
      setTouched(false);
      toast.success(t.officeHours.saved);
    },
    onError: (err: Error) => toast.error(err.message || t.common.actionFailed),
  });

  const clearDay = useMutation({
    mutationFn: () => officeHoursApi.upsert(date, [], null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-hours"] });
      setIntervals([]);
      setNotes("");
      setTouched(false);
      toast.success(t.officeHours.cleared);
    },
    onError: (err: Error) => toast.error(err.message || t.common.actionFailed),
  });

  function updateInterval(index: number, patch: Partial<OfficeHoursInterval>) {
    setTouched(true);
    setIntervals((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  }

  function addInterval() {
    setTouched(true);
    setIntervals((prev) => [...prev, { start: "09:00", end: "12:00" }]);
  }

  function removeInterval(index: number) {
    setTouched(true);
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDateChange(next: string) {
    setDate(next);
    setTouched(false);
  }

  const validationError = validateLocal(intervals);
  const canSave = touched && !validationError;

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 pb-24 lg:pb-6">
      <h1 className="text-xl font-extrabold text-text-main tracking-tight">
        {t.officeHours.pageTitle}
      </h1>

      <div className="mt-5 glass-card rounded-2xl p-4">
        <label className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-text-light" />
          <span className="text-sm font-semibold text-text-main">
            {t.officeHours.selectDate}
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="ml-auto rounded-lg border border-border-light bg-white px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="mt-5 glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-light">
            {t.officeHours.title}
          </h2>
          <button
            onClick={addInterval}
            className="btn-press flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary-dark hover:bg-primary/20"
          >
            <Plus size={14} />
            {t.officeHours.addInterval}
          </button>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-text-light">{t.common.loading}</p>
        ) : intervals.length === 0 ? (
          <p className="mt-3 text-sm text-text-light">{t.officeHours.dayEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {intervals.map((it, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 rounded-xl border border-border-light bg-white px-3 py-2"
              >
                <input
                  type="time"
                  value={it.start}
                  onChange={(e) =>
                    updateInterval(idx, { start: e.target.value })
                  }
                  className="w-24 rounded-lg border border-border-light px-2 py-1 text-sm"
                  aria-label={t.officeHours.startTime}
                />
                <span className="text-text-light">—</span>
                <input
                  type="time"
                  value={it.end}
                  onChange={(e) => updateInterval(idx, { end: e.target.value })}
                  className="w-24 rounded-lg border border-border-light px-2 py-1 text-sm"
                  aria-label={t.officeHours.endTime}
                />
                <button
                  aria-label={t.officeHours.removeInterval}
                  onClick={() => removeInterval(idx)}
                  className="ml-auto btn-press rounded-lg p-1.5 text-text-light hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-text-light">
            {t.officeHours.notesLabel}
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => {
              setTouched(true);
              setNotes(e.target.value);
            }}
            placeholder={t.officeHours.notesPlaceholder}
            className="mt-1 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm"
            maxLength={120}
          />
        </label>

        {validationError && (
          <p className="mt-3 text-xs font-semibold text-danger">
            {t.officeHours.errors[validationError as keyof typeof t.officeHours.errors]}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => upsert.mutate()}
            disabled={!canSave || upsert.isPending}
            className="btn-press flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            {t.officeHours.save}
          </button>
          {(intervals.length > 0 || notes) && (
            <button
              onClick={() => clearDay.mutate()}
              disabled={clearDay.isPending}
              className="btn-press rounded-xl px-3 py-2 text-sm font-semibold text-text-light hover:text-danger"
            >
              {t.officeHours.clearDay}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
