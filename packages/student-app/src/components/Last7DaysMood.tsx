import { useMemo } from "react";
import { buildLast7Days, type MoodCalendarDay, moodLevels } from "@tirek/shared";

const MOOD_DOT_COLOR: Record<number, string> = {
  1: "bg-red-300",
  2: "bg-orange-300",
  3: "bg-yellow-300",
  4: "bg-green-300",
  5: "bg-emerald-400",
};

interface Props {
  entries: MoodCalendarDay[];
  today: Date;
  weekdayShort: readonly string[];
  emptyLabel?: string;
}

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

function weekdayIndexAlmaty(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map((p) => Number.parseInt(p, 10));
  const utcMidnight = Date.UTC(y, m - 1, d);
  const inAlmaty = new Date(utcMidnight + ALMATY_OFFSET_MS);
  const day = inAlmaty.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function Last7DaysMood({ entries, today, weekdayShort, emptyLabel }: Props) {
  const days = useMemo(() => buildLast7Days(entries, today), [entries, today]);

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const wIdx = weekdayIndexAlmaty(d.date);
          const dayPart = Number.parseInt(d.date.slice(8, 10), 10);
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold uppercase text-text-light">
                {weekdayShort[wIdx]}
              </span>
              <span className="text-xs font-semibold text-text-main">{dayPart}</span>
              <div className="mt-1 flex flex-col items-center gap-1">
                <Dot mood={d.daySlotMood} />
                <Dot mood={d.eveningSlotMood} />
              </div>
            </div>
          );
        })}
      </div>
      {emptyLabel && days.every((d) => d.daySlotMood == null && d.eveningSlotMood == null) && (
        <p className="mt-3 text-center text-xs text-text-light">{emptyLabel}</p>
      )}
      <div className="mt-3 flex items-center justify-center gap-2">
        {moodLevels.map((m) => (
          <span key={m.value} className="text-xs">
            {m.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

function Dot({ mood }: { mood: number | null }) {
  if (mood == null) {
    return <span className="h-3 w-3 rounded-full border border-dashed border-border-light" />;
  }
  return <span className={`h-3 w-3 rounded-full ${MOOD_DOT_COLOR[mood] ?? "bg-gray-300"}`} />;
}
