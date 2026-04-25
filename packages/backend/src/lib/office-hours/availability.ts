export type Interval = { start: string; end: string };

export type DayEntry = {
  date: string;
  intervals: Interval[];
  notes: string | null;
};

export type InfoBlock =
  | { kind: 'available_now'; until: string; notes: string | null }
  | { kind: 'available_later_today'; from: string; until: string; notes: string | null }
  | { kind: 'available_tomorrow'; from: string; until: string; notes: string | null }
  | { kind: 'unavailable_today'; nextDate: string | null };

const hhmmFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Almaty',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function hhmmIn(instant: Date): string {
  return hhmmFormatter.format(instant);
}

export function infoBlockFor(
  now: Date,
  today: DayEntry | null,
  tomorrow: DayEntry | null,
): InfoBlock {
  const nowHm = hhmmIn(now);
  const todayIntervals = today?.intervals ?? [];
  const current = todayIntervals.find(
    (i) => nowHm >= i.start && nowHm < i.end,
  );
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
  const firstTomorrow = tomorrow?.intervals?.[0];
  if (firstTomorrow) {
    return {
      kind: 'available_tomorrow',
      from: firstTomorrow.start,
      until: firstTomorrow.end,
      notes: tomorrow?.notes ?? null,
    };
  }
  return { kind: 'unavailable_today', nextDate: null };
}
