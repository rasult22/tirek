import type { MoodInsights } from './mood-aggregator.js';

export type ToolOutput = {
  averageMood: number;
  trend: 'improving' | 'stable' | 'declining';
  recentEntries: number;
  insights: string[];
};

export type InsightsToToolOutputInput = {
  insights: MoodInsights;
  avgStress: number | null;
  avgSleep: number | null;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Чистый трансформер: MoodInsights + side-метрики (стресс/сон) → AI-friendly output.
 * Why: устраняет double-source расчёта тренда между mood.service и AI tool.
 * Tool ничего не считает сам — только форматирует уже подсчитанные числа.
 */
export function insightsToToolOutput(
  input: InsightsToToolOutputInput,
): ToolOutput {
  const { insights, avgStress, avgSleep } = input;

  if (insights.entryCount === 0) {
    return {
      averageMood: 0,
      trend: 'stable',
      recentEntries: 0,
      insights: [
        'За последние 14 дней нет записей настроения. Попробуй отмечать своё настроение каждый день — это поможет лучше понять себя.',
      ],
    };
  }

  const averageMood =
    insights.overallAverage !== null ? round1(insights.overallAverage) : 0;

  // Tool отдаёт только три вида тренда; neutral возникает только при пустых entries.
  const trend: 'improving' | 'stable' | 'declining' =
    insights.trend === 'neutral' ? 'stable' : insights.trend;

  const messages: string[] = [];

  if (averageMood >= 4) {
    messages.push(
      'Твоё настроение за последние две недели в целом хорошее. Отлично! Продолжай делать то, что приносит тебе радость.',
    );
  } else if (averageMood >= 3) {
    messages.push(
      'Твоё настроение за последние две недели — среднее. Это нормально, но обрати внимание на то, что помогает тебе чувствовать себя лучше.',
    );
  } else if (averageMood >= 2) {
    messages.push(
      'Твоё настроение за последние две недели было пониженным. Подумай, что могло на это повлиять, и попробуй поговорить с кем-то, кому доверяешь.',
    );
  } else {
    messages.push(
      'Твоё настроение за последние две недели было низким. Пожалуйста, поговори с школьным психологом — он(а) может помочь.',
    );
  }

  if (trend === 'improving') {
    messages.push(
      'Хорошая новость — за последнюю неделю твоё настроение улучшилось по сравнению с предыдущей.',
    );
  } else if (trend === 'declining') {
    messages.push(
      'За последнюю неделю твоё настроение немного снизилось. Это может быть временным, но стоит обратить внимание.',
    );
  }

  if (avgStress !== null && avgStress >= 4) {
    messages.push(
      'Уровень стресса довольно высокий. Попробуй дыхательные упражнения или поговори с кем-то о том, что тебя беспокоит.',
    );
  }

  if (avgSleep !== null && avgSleep <= 2) {
    messages.push(
      'Качество сна было не очень хорошим. Сон сильно влияет на настроение — попробуй ложиться в одно время и убрать телефон за час до сна.',
    );
  }

  if (insights.entryCount < 7) {
    messages.push(
      `За 14 дней ты сделал(а) ${insights.entryCount} записей. Старайся отмечать настроение каждый день — так картина будет точнее.`,
    );
  }

  return {
    averageMood,
    trend,
    recentEntries: insights.entryCount,
    insights: messages,
  };
}
