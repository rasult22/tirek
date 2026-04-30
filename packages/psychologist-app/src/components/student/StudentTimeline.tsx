import { useMemo } from "react";
import { clsx } from "clsx";
import {
  AlertCircle,
  FileText,
  Lightbulb,
  MessageSquare,
  Smile,
  Loader2,
  Clock,
} from "lucide-react";
import { useT, useLanguage } from "../../hooks/useLanguage.js";
import { DayDivider } from "../ui/DayDivider.js";
import type {
  TimelineEvent,
  TimelineEventType,
  Language,
} from "@tirek/shared";

type Filter = "all" | TimelineEventType;
type Tone = "loud" | "normal" | "muted";

const EVENT_TONE: Record<TimelineEventType, Tone> = {
  crisis: "loud",
  test: "loud",
  cbt: "normal",
  message: "normal",
  mood: "muted",
};

const EVENT_ICON: Record<TimelineEventType, typeof AlertCircle> = {
  crisis: AlertCircle,
  test: FileText,
  cbt: Lightbulb,
  message: MessageSquare,
  mood: Smile,
};

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(
  iso: string,
  language: Language,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const today = todayKey();
  const yest = yesterdayKey();
  if (iso === today) return todayLabel;
  if (iso === yest) return yesterdayLabel;
  const d = new Date(iso);
  const locale = language === "kz" ? "kk-KZ" : "ru-RU";
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(iso: string, language: Language): string {
  const locale = language === "kz" ? "kk-KZ" : "ru-RU";
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface StudentTimelineProps {
  events: TimelineEvent[];
  loading: boolean;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export function StudentTimeline({
  events,
  loading,
  filter,
  onFilterChange,
}: StudentTimelineProps) {
  const t = useT();
  const { language } = useLanguage();
  const d = t.psychologist.studentDetail;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: d.filterAll },
    { key: "test", label: d.filterTests },
    { key: "mood", label: d.filterMood },
    { key: "cbt", label: d.filterCbt },
    { key: "message", label: d.filterMessages },
    { key: "crisis", label: d.filterCrisis },
  ];

  const groups = useMemo(() => {
    const result: { day: string; items: TimelineEvent[] }[] = [];
    for (const ev of events) {
      const day = dayKey(ev.occurredAt);
      const existing = result[result.length - 1];
      if (existing && existing.day === day) {
        existing.items.push(ev);
      } else {
        result.push({ day, items: [ev] });
      }
    }
    return result;
  }, [events]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{d.timeline}</h2>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={clsx(
                "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors btn-press",
                active
                  ? "bg-brand text-brand-fg border-brand"
                  : "bg-surface text-ink border-border-light hover:bg-surface-hover",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-ink-muted" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock size={28} className="text-ink-muted mb-2" />
          <p className="text-sm text-ink-muted">{d.timelineEmpty}</p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.day}>
              <DayDivider
                label={formatDayLabel(group.day, language, d.today, d.yesterday)}
              />
              <ul className="space-y-1.5">
                {group.items.map((event) => (
                  <TimelineRow key={event.id} event={event} language={language} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TimelineRow({
  event,
  language,
}: {
  event: TimelineEvent;
  language: Language;
}) {
  const t = useT();
  const d = t.psychologist.studentDetail;

  const time = formatTime(event.occurredAt, language);
  const tone = EVENT_TONE[event.type];
  const Icon = EVENT_ICON[event.type];

  let title = "";
  let subtitle: string | null = null;
  let accentClass = "text-ink-muted";
  let accentBgClass = "bg-surface-secondary";

  if (event.type === "test") {
    title = `${d.eventTest}: ${event.payload.testName}`;
    subtitle = event.payload.severity ?? null;
    accentClass = "text-brand";
    accentBgClass = "bg-brand-soft";
  } else if (event.type === "mood") {
    title = `${d.eventMood}: ${event.payload.mood}/5`;
    subtitle = event.payload.note;
    accentClass = "text-ink-muted";
    accentBgClass = "bg-transparent";
  } else if (event.type === "cbt") {
    title = d.eventCbt;
    subtitle = event.payload.summary;
    accentClass = "text-brand";
    accentBgClass = "bg-brand-soft";
  } else if (event.type === "message") {
    title =
      event.payload.direction === "from_student"
        ? d.eventMessageFromStudent
        : d.eventMessageFromPsychologist;
    subtitle = event.payload.preview;
    accentClass = "text-ink";
    accentBgClass = "bg-surface-secondary";
  } else if (event.type === "crisis") {
    title = d.eventCrisis;
    subtitle = event.payload.summary;
    if (event.payload.severity === "high") {
      accentClass = "text-danger";
      accentBgClass = "bg-danger/10";
    } else {
      accentClass = "text-warning";
      accentBgClass = "bg-warning/10";
    }
  }

  const containerClass =
    tone === "loud"
      ? "bg-surface border border-border-light shadow-sm"
      : tone === "normal"
        ? "bg-surface border border-border-light"
        : "bg-transparent";

  const titleClass =
    tone === "loud"
      ? `text-sm font-bold ${accentClass}`
      : tone === "normal"
        ? "text-sm font-semibold text-ink"
        : "text-sm font-normal text-ink-muted";

  const iconBgClass = tone === "muted" ? "bg-transparent" : accentBgClass;

  const padY = tone === "muted" ? "py-1.5" : "py-2.5";

  return (
    <li
      className={clsx(
        "flex items-start gap-3 rounded-lg px-3",
        containerClass,
        padY,
      )}
    >
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
          iconBgClass,
          accentClass,
        )}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={clsx(titleClass, "flex-1 truncate")}>{title}</h4>
          <span className="text-[11px] text-ink-muted shrink-0">{time}</span>
        </div>
        {subtitle ? (
          <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{subtitle}</p>
        ) : null}
      </div>
    </li>
  );
}
