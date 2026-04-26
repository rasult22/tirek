import { slotOf, currentDay } from '../../lib/almaty-day/almaty-day.js';

type Entry = { createdAt: Date };

export type SlotsForDay<T extends Entry> = {
  daySlot: T | null;
  eveningSlot: T | null;
};

export function groupByAlmatyDay<T extends Entry>(entries: T[]): Record<string, SlotsForDay<T>> {
  const buckets: Record<string, T[]> = {};
  for (const entry of entries) {
    const day = currentDay(entry.createdAt);
    (buckets[day] ??= []).push(entry);
  }
  const result: Record<string, SlotsForDay<T>> = {};
  for (const [day, dayEntries] of Object.entries(buckets)) {
    result[day] = latestPerSlot(dayEntries);
  }
  return result;
}

export function latestPerSlot<T extends Entry>(entries: T[]): SlotsForDay<T> {
  let daySlot: T | null = null;
  let eveningSlot: T | null = null;

  for (const entry of entries) {
    const slot = slotOf(entry.createdAt);
    if (slot === 'day') {
      if (!daySlot || entry.createdAt > daySlot.createdAt) daySlot = entry;
    } else {
      if (!eveningSlot || entry.createdAt > eveningSlot.createdAt) eveningSlot = entry;
    }
  }

  return { daySlot, eveningSlot };
}
