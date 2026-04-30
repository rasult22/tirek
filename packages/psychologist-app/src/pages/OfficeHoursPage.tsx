import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { officeHoursApi } from "../api/office-hours.js";
import { useAuthStore } from "../store/auth-store.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { isDayOff, validateIntervals } from "@tirek/shared/office-hours";
import type {
  OfficeHoursDayOfWeek,
  OfficeHoursInterval,
  OfficeHoursTemplateEntry,
  OfficeHoursOverrideEntry,
  OfficeHoursResolved,
} from "@tirek/shared";
import { clsx } from "clsx";
import { CalendarPlus, X, Plus, Pencil } from "lucide-react";

const DOW_LABELS: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

function todayIso(now: Date = new Date()): string {
  const a = new Date(now.getTime() + ALMATY_OFFSET_MS);
  return `${a.getUTCFullYear()}-${String(a.getUTCMonth() + 1).padStart(2, "0")}-${String(a.getUTCDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((v) => Number.parseInt(v, 10));
  const utc = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

function formatIntervals(intervals: OfficeHoursInterval[]): string {
  if (isDayOff(intervals)) return "выходной";
  return intervals.map((iv) => `${iv.start}–${iv.end}`).join(", ");
}

function formatHumanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((v) => Number.parseInt(v, 10));
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  const month = [
    "янв",
    "фев",
    "мар",
    "апр",
    "май",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ][m! - 1];
  return `${DOW_LABELS[dow]} ${d} ${month}`;
}

export function OfficeHoursPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const psychologistId = user?.id ?? "";

  const today = todayIso();
  const overrideRangeFrom = today;
  const overrideRangeTo = addDaysIso(today, 28);

  const {
    data: template,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["office-hours-template"],
    queryFn: () => officeHoursApi.getTemplate(),
  });

  const { data: overrides } = useQuery({
    queryKey: ["office-hours-overrides", overrideRangeFrom, overrideRangeTo],
    queryFn: () =>
      officeHoursApi.getOverrides(overrideRangeFrom, overrideRangeTo),
  });

  const { data: todayResolved } = useQuery({
    queryKey: ["office-hours-resolve", psychologistId, today],
    queryFn: () => officeHoursApi.resolve(psychologistId, today),
    enabled: psychologistId.length > 0,
  });

  const { data: tomorrowResolved } = useQuery({
    queryKey: ["office-hours-resolve", psychologistId, addDaysIso(today, 1)],
    queryFn: () =>
      officeHoursApi.resolve(psychologistId, addDaysIso(today, 1)),
    enabled: psychologistId.length > 0,
  });

  const templateByDow = useMemo(() => {
    const m = new Map<number, OfficeHoursTemplateEntry>();
    for (const row of template ?? []) m.set(row.dayOfWeek, row);
    return m;
  }, [template]);

  const sortedOverrides = useMemo(() => {
    return [...(overrides ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [overrides]);

  const [editingDow, setEditingDow] = useState<OfficeHoursDayOfWeek | null>(
    null,
  );
  const [overrideMode, setOverrideMode] = useState<
    | { kind: "create" }
    | {
        kind: "edit";
        date: string;
        intervals: OfficeHoursInterval[];
        notes: string | null;
      }
    | null
  >(null);

  const editingTemplateRow =
    editingDow != null ? templateByDow.get(editingDow) : null;

  const upsertTemplateMut = useMutation({
    mutationFn: ({
      dayOfWeek,
      intervals,
      notes,
    }: {
      dayOfWeek: OfficeHoursDayOfWeek;
      intervals: OfficeHoursInterval[];
      notes: string | null;
    }) => officeHoursApi.upsertTemplateDay(dayOfWeek, intervals, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-template"] });
      qc.invalidateQueries({ queryKey: ["office-hours-resolve"] });
      setEditingDow(null);
    },
  });

  const upsertOverrideMut = useMutation({
    mutationFn: ({
      date,
      intervals,
      notes,
    }: {
      date: string;
      intervals: OfficeHoursInterval[];
      notes: string | null;
    }) => officeHoursApi.upsertOverrideDay(date, intervals, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-overrides"] });
      qc.invalidateQueries({ queryKey: ["office-hours-resolve"] });
      setOverrideMode(null);
    },
  });

  const deleteOverrideMut = useMutation({
    mutationFn: (date: string) => officeHoursApi.deleteOverrideDay(date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-hours-overrides"] });
      qc.invalidateQueries({ queryKey: ["office-hours-resolve"] });
    },
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-text-main">Расписание</h1>

      {/* Today / tomorrow preview row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PreviewCard label="Сегодня" resolved={todayResolved} />
        <PreviewCard label="Завтра" resolved={tomorrowResolved} />
      </div>

      {/* Weekly grid */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-light mb-3">
          Шаблон недели
        </h2>
        {isLoading ? (
          <div className="rounded-2xl bg-surface border border-border-light p-8 flex items-center justify-center">
            <p className="text-sm text-text-light">Загрузка…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {([1, 2, 3, 4, 5, 6, 7] as OfficeHoursDayOfWeek[]).map((dow) => {
              const row = templateByDow.get(dow);
              const intervals = row?.intervals ?? [];
              const off = isDayOff(intervals);
              return (
                <button
                  key={dow}
                  onClick={() => setEditingDow(dow)}
                  className={clsx(
                    "group p-3 rounded-2xl text-left transition-all border",
                    off
                      ? "bg-surface-secondary border-border-light hover:border-border"
                      : "bg-surface border-brand/15 hover:border-brand/40 hover:shadow-sm",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={clsx(
                        "text-xs font-bold uppercase tracking-wide",
                        off ? "text-text-light" : "text-brand-deep",
                      )}
                    >
                      {DOW_LABELS[dow]}
                    </span>
                    <Pencil
                      size={12}
                      className="text-text-light opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  {off ? (
                    <p className="text-xs text-text-light italic">выходной</p>
                  ) : (
                    <div className="space-y-1 tabular-nums">
                      {intervals.map((iv, i) => (
                        <div
                          key={i}
                          className="text-[12px] font-semibold text-text-main"
                        >
                          {iv.start}–{iv.end}
                        </div>
                      ))}
                    </div>
                  )}
                  {row?.notes && (
                    <p className="mt-1 text-[10px] text-text-light italic truncate">
                      {row.notes}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Overrides */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-light">
              Исключения
            </h2>
            <p className="text-xs text-text-light/80 mt-0.5">
              Ближайшие 4 недели
            </p>
          </div>
          <button
            onClick={() => setOverrideMode({ kind: "create" })}
            className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
          >
            <Plus size={12} />
            Добавить
          </button>
        </div>

        {sortedOverrides.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-border-light p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary mx-auto mb-2 flex items-center justify-center">
              <CalendarPlus size={18} className="text-text-light" />
            </div>
            <p className="text-sm text-text-light">Исключений нет</p>
          </div>
        ) : (
          <ul className="rounded-2xl border border-border-light overflow-hidden bg-surface divide-y divide-border-light">
            {sortedOverrides.map((ov: OfficeHoursOverrideEntry) => {
              const off = isDayOff(ov.intervals);
              return (
                <li key={ov.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    className="flex-1 text-left"
                    onClick={() =>
                      setOverrideMode({
                        kind: "edit",
                        date: ov.date,
                        intervals: ov.intervals,
                        notes: ov.notes,
                      })
                    }
                  >
                    <div className="font-semibold text-text-main">
                      {formatHumanDate(ov.date)}
                    </div>
                    <div
                      className={clsx(
                        "text-xs",
                        off ? "text-text-light italic" : "text-text-light",
                      )}
                    >
                      {formatIntervals(ov.intervals)}
                      {ov.notes ? ` · ${ov.notes}` : ""}
                    </div>
                  </button>
                  <button
                    onClick={() => deleteOverrideMut.mutate(ov.date)}
                    className="p-1.5 rounded-lg text-text-light hover:bg-danger/10 hover:text-danger transition-colors"
                    aria-label="Удалить"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Edit template day modal */}
      {editingDow != null ? (
        <IntervalsEditorModal
          title={`Шаблон: ${DOW_LABELS[editingDow]}`}
          initialIntervals={editingTemplateRow?.intervals ?? []}
          initialNotes={editingTemplateRow?.notes ?? null}
          saving={upsertTemplateMut.isPending}
          onClose={() => setEditingDow(null)}
          onSave={(intervals, notes) =>
            upsertTemplateMut.mutate({ dayOfWeek: editingDow, intervals, notes })
          }
        />
      ) : null}

      {overrideMode != null ? (
        <OverrideEditorModal
          fixedDate={overrideMode.kind === "edit" ? overrideMode.date : undefined}
          initialIntervals={
            overrideMode.kind === "edit" ? overrideMode.intervals : []
          }
          initialNotes={
            overrideMode.kind === "edit" ? overrideMode.notes : null
          }
          saving={upsertOverrideMut.isPending}
          onClose={() => setOverrideMode(null)}
          onSave={(date, intervals, notes) =>
            upsertOverrideMut.mutate({ date, intervals, notes })
          }
        />
      ) : null}
    </div>
  );
}

function PreviewCard({
  label,
  resolved,
}: {
  label: string;
  resolved: OfficeHoursResolved | undefined;
}) {
  if (!resolved) {
    return (
      <div className="rounded-2xl bg-surface border border-border-light p-4">
        <p className="text-xs uppercase tracking-wide text-text-light font-semibold">
          {label}
        </p>
        <p className="text-sm text-text-light mt-1">загрузка…</p>
      </div>
    );
  }
  const off = isDayOff(resolved.intervals);
  return (
    <div
      className={clsx(
        "rounded-2xl p-4 border",
        off
          ? "bg-surface-secondary border-border-light"
          : "bg-gradient-to-br from-brand-soft to-surface border-brand/15",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-text-light font-semibold">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-bold tabular-nums",
          off ? "text-text-light text-sm italic" : "text-text-main text-base",
        )}
      >
        {off ? "выходной" : formatIntervals(resolved.intervals)}
      </p>
      {resolved.notes ? (
        <p className="text-xs text-text-light italic mt-0.5 truncate">
          {resolved.notes}
        </p>
      ) : null}
    </div>
  );
}

// ── Modals ───────────────────────────────────────────────────

interface IntervalsEditorModalProps {
  title: string;
  initialIntervals: OfficeHoursInterval[];
  initialNotes: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (intervals: OfficeHoursInterval[], notes: string | null) => void;
}

function IntervalsEditorModal({
  title,
  initialIntervals,
  initialNotes,
  saving,
  onClose,
  onSave,
}: IntervalsEditorModalProps) {
  const [dayOff, setDayOff] = useState(initialIntervals.length === 0);
  const [intervals, setIntervals] = useState<OfficeHoursInterval[]>(
    initialIntervals.length > 0
      ? initialIntervals
      : [{ start: "09:00", end: "17:00" }],
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);

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
    <ModalShell title={title} onClose={onClose}>
      <DayOffToggle
        dayOff={dayOff}
        onChange={(v) => {
          setDayOff(v);
          setError(null);
        }}
      />
      {!dayOff ? (
        <IntervalsEditor
          intervals={intervals}
          onChange={(next) => {
            setIntervals(next);
            setError(null);
          }}
        />
      ) : null}
      <NotesInput value={notes} onChange={setNotes} />
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <ModalActions saving={saving} onCancel={onClose} onSave={handleSave} />
    </ModalShell>
  );
}

interface OverrideEditorModalProps {
  fixedDate?: string;
  initialIntervals: OfficeHoursInterval[];
  initialNotes: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (
    date: string,
    intervals: OfficeHoursInterval[],
    notes: string | null,
  ) => void;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function OverrideEditorModal({
  fixedDate,
  initialIntervals,
  initialNotes,
  saving,
  onClose,
  onSave,
}: OverrideEditorModalProps) {
  const [date, setDate] = useState(fixedDate ?? todayIso());
  const [dayOff, setDayOff] = useState(initialIntervals.length === 0);
  const [intervals, setIntervals] = useState<OfficeHoursInterval[]>(
    initialIntervals.length > 0
      ? initialIntervals
      : [{ start: "09:00", end: "17:00" }],
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDate(fixedDate ?? todayIso());
  }, [fixedDate]);

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
    <ModalShell
      title={fixedDate ? "Исключение" : "Новое исключение"}
      onClose={onClose}
    >
      <label className="block text-xs text-text-light mb-1 font-semibold uppercase tracking-wide">
        Дата
      </label>
      {fixedDate ? (
        <p className="font-semibold mb-2">{fixedDate}</p>
      ) : (
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError(null);
          }}
          className="w-full rounded-lg border border-input-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      )}
      <div className="mt-4" />
      <DayOffToggle
        dayOff={dayOff}
        onChange={(v) => {
          setDayOff(v);
          setError(null);
        }}
      />
      {!dayOff ? (
        <IntervalsEditor
          intervals={intervals}
          onChange={(next) => {
            setIntervals(next);
            setError(null);
          }}
        />
      ) : null}
      <NotesInput value={notes} onChange={setNotes} />
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <ModalActions saving={saving} onCancel={onClose} onSave={handleSave} />
    </ModalShell>
  );
}

// ── Modal building blocks ───────────────────────────────────

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-main">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center"
            aria-label="Close"
          >
            <X size={16} className="text-text-light" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DayOffToggle({
  dayOff,
  onChange,
}: {
  dayOff: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm font-medium text-text-main">Выходной</span>
      <input
        type="checkbox"
        checked={dayOff}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
  );
}

function IntervalsEditor({
  intervals,
  onChange,
}: {
  intervals: OfficeHoursInterval[];
  onChange: (next: OfficeHoursInterval[]) => void;
}) {
  function update(idx: number, field: "start" | "end", value: string) {
    onChange(
      intervals.map((iv, i) => (i === idx ? { ...iv, [field]: value } : iv)),
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-auto">
      {intervals.map((iv, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="time"
            value={iv.start}
            onChange={(e) => update(idx, "start", e.target.value)}
            className="flex-1 rounded-lg border border-input-border bg-surface px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <span className="text-text-light">—</span>
          <input
            type="time"
            value={iv.end}
            onChange={(e) => update(idx, "end", e.target.value)}
            className="flex-1 rounded-lg border border-input-border bg-surface px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            onClick={() => onChange(intervals.filter((_, i) => i !== idx))}
            className="p-1.5 rounded-lg text-text-light hover:bg-danger/10 hover:text-danger transition-colors"
            aria-label="Удалить интервал"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          onChange([...intervals, { start: "09:00", end: "12:00" }])
        }
        className="flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <Plus size={12} />
        Добавить интервал
      </button>
    </div>
  );
}

function NotesInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <label className="block text-xs text-text-light mt-3 mb-1 font-semibold uppercase tracking-wide">
        Заметка (необязательно)
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="напр. конференция"
        className="w-full rounded-lg border border-input-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </>
  );
}

function ModalActions({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-5 flex gap-3">
      <button
        onClick={onCancel}
        className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-sm font-bold text-text-light hover:bg-surface-hover transition-colors"
      >
        Отмена
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </div>
  );
}
