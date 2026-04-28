export type Interval = { start: string; end: string };

export type DayEntry = {
  date: string;
  intervals: Interval[];
  notes: string | null;
};

export type InfoBlock =
  | { kind: 'available_now'; until: string; notes: string | null }
  | { kind: 'available_later_today'; from: string; until: string; notes: string | null }
  | {
      kind: 'finished_today';
      lastEnd: string;
      notes: string | null;
      tomorrowFrom: string | null;
      tomorrowUntil: string | null;
    }
  | {
      kind: 'day_off_today';
      tomorrowFrom: string | null;
      tomorrowUntil: string | null;
    };

const hhmmFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Almaty',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function hhmmIn(instant: Date): string {
  return hhmmFormatter.format(instant);
}

function firstTomorrow(tomorrow: DayEntry | null): { from: string; until: string } | null {
  const slot = tomorrow?.intervals?.[0];
  return slot ? { from: slot.start, until: slot.end } : null;
}

export function infoBlockFor(
  now: Date,
  today: DayEntry | null,
  tomorrow: DayEntry | null,
): InfoBlock {
  const nowHm = hhmmIn(now);
  const todayIntervals = today?.intervals ?? [];

  const current = todayIntervals.find((i) => nowHm >= i.start && nowHm < i.end);
  if (current) {
    return {
      kind: 'available_now',
      until: current.end,
      notes: today?.notes ?? null,
    };
  }

  const nextToday = todayIntervals.find((i) => nowHm < i.start);
  if (nextToday) {
    return {
      kind: 'available_later_today',
      from: nextToday.start,
      until: nextToday.end,
      notes: today?.notes ?? null,
    };
  }

  const tomorrowSlot = firstTomorrow(tomorrow);

  // Сегодня были интервалы, все позади → finished_today.
  if (todayIntervals.length > 0) {
    const lastEnd = todayIntervals[todayIntervals.length - 1]!.end;
    return {
      kind: 'finished_today',
      lastEnd,
      notes: today?.notes ?? null,
      tomorrowFrom: tomorrowSlot?.from ?? null,
      tomorrowUntil: tomorrowSlot?.until ?? null,
    };
  }

  // Сегодня intervals=[] (или today=null) → day_off_today.
  return {
    kind: 'day_off_today',
    tomorrowFrom: tomorrowSlot?.from ?? null,
    tomorrowUntil: tomorrowSlot?.until ?? null,
  };
}
