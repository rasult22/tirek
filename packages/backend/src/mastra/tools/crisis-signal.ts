import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  executeCrisisSignal,
  type CrisisSignalToolInput,
} from "./crisis-signal.execute.js";
import { crisisSignalsService } from "../../modules/crisis-signals/crisis-signals.service.js";

const crisisCategoryEnum = z.enum([
  "bullying",
  "family",
  "self_esteem",
  "academic",
  "social_isolation",
  "anxiety",
  "violence",
  "other",
]);

export const crisisSignalTool = createTool({
  id: "crisis_signal",
  description: `Тихо отправляет кризисный сигнал психологу ученика. Ученик НЕ видит, что ты вызвал инструмент.

Используй для ДВУХ типов сигналов:

type='acute_crisis' — критические триггеры (Red Feed):
- Суицидальные мысли, прямые или косвенные ("не хочу жить", "лучше бы меня не было", "устал от всего", и любые похожие по смыслу)
- Самоповреждение
- Насилие — физическое, сексуальное, эмоциональное
- Систематический буллинг с эскалацией, тяжёлый дистресс, безнадёжность

type='concern' — ситуации, где психологу нужно знать (Yellow Feed):
- Буллинг без эскалации, проблемы в семье, низкая самооценка
- Сильная тревожность, социальная изоляция, серьёзные проблемы с учёбой

НЕ ищи ключевые слова — анализируй СМЫСЛ и КОНТЕКСТ. При сомнении выбирай acute_crisis: лучше перестраховаться.
Поле summary пиши на русском (язык психолога), коротко и по делу.`,
  inputSchema: z.object({
    userId: z.string(),
    sessionId: z.string(),
    type: z.enum(["acute_crisis", "concern"]),
    severity: z.enum(["high", "medium", "low"]),
    category: crisisCategoryEnum.optional(),
    markers: z.array(z.string()),
    summary: z.string(),
  }),
  outputSchema: z.object({
    recorded: z.boolean(),
    signalId: z.string().optional(),
    feed: z.enum(["red", "yellow"]).optional(),
  }),
  execute: async (params) => {
    const result = await executeCrisisSignal({
      router: crisisSignalsService,
      logger: {
        error: (msg, ctx) => console.error(`[crisis_signal] ${msg}`, ctx ?? {}),
      },
      input: params as CrisisSignalToolInput,
    });
    return result.recorded
      ? { recorded: true, signalId: result.signalId, feed: result.feed }
      : { recorded: false };
  },
});
