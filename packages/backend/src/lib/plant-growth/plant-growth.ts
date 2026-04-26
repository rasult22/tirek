// Пороги Plant Stage по PRD §23: 0-49 росток, 50-149 кустик, 150-299 дерево, 300+ цветущее.
const STAGE_THRESHOLDS = [0, 50, 150, 300] as const;

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export type IsSleepingInput = {
  lastWateredAt: Date | null;
  now: Date;
};

export function computeStage(points: number): 1 | 2 | 3 | 4 {
  if (points >= STAGE_THRESHOLDS[3]) return 4;
  if (points >= STAGE_THRESHOLDS[2]) return 3;
  if (points >= STAGE_THRESHOLDS[1]) return 2;
  return 1;
}

// Sleep — растение не получало активности более 2 суток.
// Используется для UI-сигнала «полей меня». Граница 2 дня выбрана не строгой:
// ровно 2 дня — ещё не сон, нужно > 2.
export function isSleeping({ lastWateredAt, now }: IsSleepingInput): boolean {
  if (lastWateredAt === null) return false;
  return now.getTime() - lastWateredAt.getTime() > TWO_DAYS_MS;
}

// Следующий порог стадии. Для финальной стадии возвращает её же
// (расти дальше некуда — UI показывает 0 «до следующей»).
export function pointsToNextStage(points: number): number {
  const stage = computeStage(points);
  if (stage === 4) return STAGE_THRESHOLDS[3];
  return STAGE_THRESHOLDS[stage];
}
