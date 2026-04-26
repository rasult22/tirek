export type AchievementTrigger =
  | 'mood'
  | 'exercise'
  | 'journal'
  | 'test'
  | 'streak'
  | 'plant';

/**
 * Контекст для проверки achievement-условий.
 * Все счётчики собираются на стороне сервиса (SQL) и передаются сюда уже как числа,
 * чтобы pure-функции `isConditionMet` оставались тестируемыми без БД.
 */
export type AchievementContext = {
  /** Сколько mood-entries у пользователя (всего). */
  moodCount: number;
  /** Сколько exercise-completions всего. */
  exerciseCount: number;
  /** Сколько exercise-completions именно по дыхательным упражнениям (type='breathing'). */
  breathingExerciseCount: number;
  /** Сколько журнальных записей у пользователя. */
  journalCount: number;
  /** Сколько diagnostic-sessions завершено (completedAt is not null). */
  completedTestSessionsCount: number;
  /** Сколько РАЗНЫХ diagnostic-tests завершено (distinct testId среди completed). */
  distinctCompletedTestsCount: number;
  /** Всего тестов в каталоге (для all-tests). */
  totalTestsCount: number;
  /** Текущий streak пользователя в днях. */
  currentStreak: number;
  /** Текущая стадия растения 1..4. */
  plantStage: 1 | 2 | 3 | 4;
};

const TRIGGER_SLUGS: Record<AchievementTrigger, string[]> = {
  mood: ['first-mood', 'mood-expert'],
  exercise: ['first-exercise', 'breathing-master', 'exercise-master'],
  journal: ['first-journal', 'journal-keeper'],
  test: ['first-test', 'test-explorer', 'all-tests'],
  streak: ['streak-3', 'streak-7', 'streak-30'],
  plant: ['plant-sprout', 'plant-tree', 'plant-bloom'],
};

export function getCandidateSlugs(trigger: AchievementTrigger): string[] {
  return TRIGGER_SLUGS[trigger];
}

/**
 * Pure-проверка: достигнуто ли условие achievement для данного контекста.
 *
 * Пороги (см. seed-data.ts — описания на русском/казахском совпадают):
 * - first-mood / first-exercise / first-journal / first-test: 1+ соответствующая запись.
 * - mood-expert: 30 mood-записей.
 * - breathing-master: 10 дыхательных упражнений.
 *   Why: breathing — отдельная мастерская ветка (UI-категория «дыхание»),
 *   порог ниже общего exercise-master, чтобы быстрее давать ранний reward.
 * - exercise-master: 25 упражнений ВСЕХ типов.
 * - journal-keeper: 15 журнальных записей.
 * - test-explorer: 3 РАЗНЫХ завершённых теста.
 * - all-tests: завершены все тесты из каталога (distinctCompletedTestsCount >= totalTestsCount,
 *   при этом totalTestsCount > 0, иначе пустой каталог не считается «всё пройдено»).
 * - streak-3 / streak-7 / streak-30: текущий streak >= порога.
 * - plant-sprout / plant-tree / plant-bloom: растение достигло стадии 2 / 3 / 4.
 */
export function isConditionMet(slug: string, ctx: AchievementContext): boolean {
  switch (slug) {
    case 'first-mood':
      return ctx.moodCount >= 1;
    case 'first-exercise':
      return ctx.exerciseCount >= 1;
    case 'first-journal':
      return ctx.journalCount >= 1;
    case 'first-test':
      return ctx.completedTestSessionsCount >= 1;
    case 'streak-3':
      return ctx.currentStreak >= 3;
    case 'streak-7':
      return ctx.currentStreak >= 7;
    case 'streak-30':
      return ctx.currentStreak >= 30;
    case 'breathing-master':
      return ctx.breathingExerciseCount >= 10;
    case 'exercise-master':
      return ctx.exerciseCount >= 25;
    case 'mood-expert':
      return ctx.moodCount >= 30;
    case 'journal-keeper':
      return ctx.journalCount >= 15;
    case 'test-explorer':
      return ctx.distinctCompletedTestsCount >= 3;
    case 'all-tests':
      // Пустой каталог тестов не засчитывается, иначе ачивку можно «получить» в обход прогресса.
      if (ctx.totalTestsCount <= 0) return false;
      return ctx.distinctCompletedTestsCount >= ctx.totalTestsCount;
    case 'plant-sprout':
      return ctx.plantStage >= 2;
    case 'plant-tree':
      return ctx.plantStage >= 3;
    case 'plant-bloom':
      return ctx.plantStage >= 4;
    default:
      return false;
  }
}
