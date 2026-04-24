export type Slot = 'day' | 'evening';

const TIMEZONE = 'Asia/Almaty';

// Граница Day Slot / Evening Slot по UBIQUITOUS_LANGUAGE: 18:00 включительно — evening.
const EVENING_HOUR = 18;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

type AlmatyParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsInAlmaty(instant: Date): AlmatyParts {
  const parts = partsFormatter.formatToParts(instant);
  const pick = (type: string) => Number.parseInt(parts.find((p) => p.type === type)!.value, 10);
  const rawHour = pick('hour');
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: pick('minute'),
    second: pick('second'),
  };
}

function formatDay({ year, month, day }: AlmatyParts): string {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

function parseDayAsUtc(day: string): number {
  const [year, month, dayOfMonth] = day.split('-').map((part) => Number.parseInt(part, 10));
  return Date.UTC(year, month - 1, dayOfMonth);
}

function almatyOffsetMs(instant: Date): number {
  const parts = partsInAlmaty(instant);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return localAsUtc - instant.getTime();
}

export function slotOf(timestamp: Date): Slot {
  return partsInAlmaty(timestamp).hour >= EVENING_HOUR ? 'evening' : 'day';
}

export function currentDay(now: Date = new Date()): string {
  return formatDay(partsInAlmaty(now));
}

export function isSameDay(a: Date, b: Date): boolean {
  return currentDay(a) === currentDay(b);
}

export function daysBetween(a: Date, b: Date): number {
  const aUtc = parseDayAsUtc(currentDay(a));
  const bUtc = parseDayAsUtc(currentDay(b));
  return Math.abs(Math.round((bUtc - aUtc) / MS_PER_DAY));
}

export function startOfDay(day: string): Date {
  const naiveUtc = parseDayAsUtc(day);
  const offset = almatyOffsetMs(new Date(naiveUtc));
  return new Date(naiveUtc - offset);
}

export function endOfDay(day: string): Date {
  return new Date(startOfDay(day).getTime() + MS_PER_DAY - 1);
}
