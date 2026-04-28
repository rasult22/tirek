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
  const month = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][m! - 1];
  return `${DOW_LABELS[dow]} ${d} ${month}`;
}

export function OfficeHoursPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const psychologistId = user?.id ?? "";

  const today = todayIso();
  const overrideRangeFrom = today;
  const overrideRangeTo = addDaysIso(today, 28);

  const { data: template, isLoading, isError, refetch } = useQuery({
    queryKey: ["office-hours-template"],
    queryFn: () => officeHoursApi.getTemplate(),
  });

  const { data: overrides } = useQuery({
    queryKey: ["office-hours-overrides", overrideRangeFrom, overrideRangeTo],
    queryFn: () => officeHoursApi.getOverrides(overrideRangeFrom, overrideRangeTo),
  });

  const { data: todayResolved } = useQuery({
    queryKey: ["office-hours-resolve", psychologistId, today],
    queryFn: () => officeHoursApi.resolve(psychologistId, today),
    enabled: psychologistId.length > 0,
  });

  const { data: tomorrowResolved } = useQuery({
    queryKey: ["office-hours-resolve", psychologistId, addDaysIso(today, 1)],
    queryFn: () => officeHoursApi.resolve(psychologistId, addDaysIso(today, 1)),
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

  const [editingDow, setEditingDow] = useState<OfficeHoursDayOfWeek | null>(null);
  const [overrideMode, setOverrideMode] = useState<
    | { kind: "create" }
    | { kind: "edit"; date: string; intervals: OfficeHoursInterval[]; notes: string | null }
    | null
  >(null);

  const editingTemplateRow = editingDow != null ? templateByDow.get(editingDow) : null;

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
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Расписание</h1>

      {/* ── Шаблон недели ─────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">Шаблон недели</h2>
        {isLoading ? (
          <p className="text-sm text-text-light">Загрузка…</p>
        ) : (
          <ul className="rounded-lg border border-border-light overflow-hidden">
            {([1, 2, 3, 4, 5, 6, 7] as OfficeHoursDayOfWeek[]).map((dow, i) => {
              const row = templateByDow.get(dow);
              const intervals = row?.intervals ?? [];
              return (
                <li
                  key={dow}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-hover cursor-pointer ${i < 6 ? "border-b border-border-light" : ""}`}
                  onClick={() => setEditingDow(dow)}
                >
                  <div className="w-8 font-semibold">{DOW_LABELS[dow]}</div>
                  <div
                    className={`flex-1 tabular-nums ${isDayOff(intervals) ? "text-text-light" : ""}`}
                  >
                    {formatIntervals(intervals)}
                  </div>
                  <span className="text-text-light text-sm">✏</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Исключения ────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-base font-semibold">Исключения</h2>
        <p className="text-xs text-text-light mb-2">Ближайшие 4 недели</p>
        {sortedOverrides.length === 0 ? (
          <p className="text-sm text-text-light mb-3">Исключений нет.</p>
        ) : (
          <ul className="rounded-lg border border-border-light overflow-hidden mb-3">
            {sortedOverrides.map((ov: OfficeHoursOverrideEntry, i) => (
              <li
                key={ov.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < sortedOverrides.length - 1 ? "border-b border-border-light" : ""}`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    setOverrideMode({
                      kind: "edit",
                      date: ov.date,
                      intervals: ov.intervals,
                      notes: ov.notes,
                    })
                  }
                >
                  <div className="font-semibold">{formatHumanDate(ov.date)}</div>
                  <div className="text-sm text-text-light">
                    {formatIntervals(ov.intervals)}
                    {ov.notes ? ` · ${ov.notes}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => deleteOverrideMut.mutate(ov.date)}
                  className="text-text-light hover:text-danger px-2"
                  aria-label="Удалить исключение"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => setOverrideMode({ kind: "create" })}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-hover"
        >
          + Добавить исключение
        </button>
      </section>

      {/* ── Превью ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold mb-2">Превью</h2>
        <div className="rounded-lg border border-border-light p-4 space-y-2">
          <PreviewLine label="Сегодня" resolved={todayResolved} />
          <div className="border-t border-border-light" />
          <PreviewLine label="Завтра" resolved={tomorrowResolved} />
        </div>
      </section>

      {/* ── Modal: edit template day ─────────────────────────── */}
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

      {/* ── Modal: override editor ─────────────────────────── */}
      {overrideMode != null ? (
        <OverrideEditorModal
          fixedDate={overrideMode.kind === "edit" ? overrideMode.date : undefined}
          initialIntervals={overrideMode.kind === "edit" ? overrideMode.intervals : []}
          initialNotes={overrideMode.kind === "edit" ? overrideMode.notes : null}
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

function PreviewLine({
  label,
  resolved,
}: {
  label: string;
  resolved: OfficeHoursResolved | undefined;
}) {
  if (!resolved) {
    return (
      <p className="text-sm text-text-light">
        <span className="font-semibold text-text-main">{label}: </span>
        загрузка…
      </p>
    );
  }
  const offDay = isDayOff(resolved.intervals);
  return (
    <div>
      <p className="text-sm">
        <span className="font-semibold">{label}: </span>
        <span className="text-text-light">
          {offDay ? "выходной" : `работает ${formatIntervals(resolved.intervals)}`}
        </span>
      </p>
      {resolved.notes ? (
        <p className="text-xs text-text-light italic mt-0.5">{resolved.notes}</p>
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
    initialIntervals.length > 0 ? initialIntervals : [{ start: "09:00", end: "17:00" }],
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
      <DayOffToggle dayOff={dayOff} onChange={(v) => { setDayOff(v); setError(null); }} />
      {!dayOff ? (
        <IntervalsEditor
          intervals={intervals}
          onChange={(next) => { setIntervals(next); setError(null); }}
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
  onSave: (date: string, intervals: OfficeHoursInterval[], notes: string | null) => void;
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
    initialIntervals.length > 0 ? initialIntervals : [{ start: "09:00", end: "17:00" }],
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
    <ModalShell title={fixedDate ? "Исключение" : "Новое исключение"} onClose={onClose}>
      <label className="block text-xs text-text-light mb-1">Дата</label>
      {fixedDate ? (
        <p className="font-semibold mb-2">{fixedDate}</p>
      ) : (
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setError(null); }}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      )}
      <div className="mt-3" />
      <DayOffToggle dayOff={dayOff} onChange={(v) => { setDayOff(v); setError(null); }} />
      {!dayOff ? (
        <IntervalsEditor
          intervals={intervals}
          onChange={(next) => { setIntervals(next); setError(null); }}
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
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="text-text-light text-xl leading-none">
            ×
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
    <label className="flex items-center justify-between py-2">
      <span>Выходной</span>
      <input
        type="checkbox"
        checked={dayOff}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
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
    onChange(intervals.map((iv, i) => (i === idx ? { ...iv, [field]: value } : iv)));
  }

  return (
    <div className="space-y-2 max-h-64 overflow-auto">
      {intervals.map((iv, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="time"
            value={iv.start}
            onChange={(e) => update(idx, "start", e.target.value)}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm tabular-nums"
          />
          <span className="text-text-light">—</span>
          <input
            type="time"
            value={iv.end}
            onChange={(e) => update(idx, "end", e.target.value)}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm tabular-nums"
          />
          <button
            onClick={() => onChange(intervals.filter((_, i) => i !== idx))}
            className="text-text-light hover:text-danger px-2"
            aria-label="Удалить интервал"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...intervals, { start: "09:00", end: "12:00" }])}
        className="text-sm text-primary hover:underline"
      >
        + Добавить интервал
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
      <label className="block text-xs text-text-light mt-3 mb-1">
        Заметка (необязательно)
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="напр. конференция"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
        className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-sm font-bold hover:bg-surface-hover"
      >
        Отмена
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </div>
  );
}
