// Almaty timezone — фиксированное смещение UTC+5 (без DST).
const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;
const EVENING_SLOT_HOUR_ALMATY = 18;
const EVENING_PROMPT_HOUR_ALMATY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

// Час в Almaty-таймзоне для UTC-момента.
function hourInAlmaty(timestamp: Date): number {
  return new Date(timestamp.getTime() + ALMATY_OFFSET_MS).getUTCHours();
}

// 20:00 Almaty Almaty-дня, в котором лежит `instant`.
function eveningPromptOfAlmatyDay(instant: Date): Date {
  // Конструируем 20:00 Almaty через "псевдо-UTC": берём instant в Almaty-таймзоне,
  // обнуляем час в 20:00, потом снимаем смещение.
  const inAlmaty = new Date(instant.getTime() + ALMATY_OFFSET_MS);
  inAlmaty.setUTCHours(EVENING_PROMPT_HOUR_ALMATY, 0, 0, 0);
  return new Date(inAlmaty.getTime() - ALMATY_OFFSET_MS);
}

export function isEveningSlot(timestamp: Date): boolean {
  return hourInAlmaty(timestamp) >= EVENING_SLOT_HOUR_ALMATY;
}

export function shouldShowEveningPrompt(input: {
  hasEveningSlotToday: boolean;
}): boolean {
  return !input.hasEveningSlotToday;
}

// Ближайший 20:00 Almaty строго после `now`.
export function nextEveningPromptAt(now: Date): Date {
  const today = eveningPromptOfAlmatyDay(now);
  if (today.getTime() > now.getTime()) return today;
  return new Date(today.getTime() + DAY_MS);
}

// 20:00 Almaty следующего Almaty-дня относительно `from`.
// Используется после Evening check-in: пуш на сегодня не нужен, ставим на завтра.
export function nextDayEveningPromptAt(from: Date): Date {
  return new Date(eveningPromptOfAlmatyDay(from).getTime() + DAY_MS);
}
