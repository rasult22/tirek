import type { MoodCalendarDay } from "../types/index.js";

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function almatyDay(instant: Date): string {
  const inAlmaty = new Date(instant.getTime() + ALMATY_OFFSET_MS);
  const year = inAlmaty.getUTCFullYear();
  const month = inAlmaty.getUTCMonth() + 1;
  const day = inAlmaty.getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDay(day: string, deltaDays: number): string {
  const [y, m, d] = day.split("-").map((p) => Number.parseInt(p, 10));
  const utcMidnight = Date.UTC(y, m - 1, d) + deltaDays * DAY_MS;
  const shifted = new Date(utcMidnight);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

export function buildLast7Days(
  entries: MoodCalendarDay[],
  today: Date,
): MoodCalendarDay[] {
  const todayDay = almatyDay(today);
  const byDate = new Map<string, MoodCalendarDay>();
  for (const e of entries) byDate.set(e.date, e);

  const result: MoodCalendarDay[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const date = shiftDay(todayDay, -offset);
    const found = byDate.get(date);
    result.push(
      found ?? { date, daySlotMood: null, eveningSlotMood: null },
    );
  }
  return result;
}
