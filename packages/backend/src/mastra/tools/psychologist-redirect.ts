import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { executePsychologistRedirect } from "./psychologist-redirect.execute.js";

export const psychologistRedirectTool = createTool({
  id: "psychologist_redirect",
  description: `UX-подсказка: показать ученику карточку "Написать [имя психолога]" в чате.

Вызывай ТОЛЬКО для НЕЗНАЧИТЕЛЬНЫХ ситуаций, где помощь психолога — это разумная опция, но риска нет:
- Бытовые конфликты (поссорился с другом/подругой)
- Стресс перед контрольной/экзаменом без катастрофизации
- Грусть без опасных маркеров
- Ученик сам спрашивает "к кому обратиться"

НЕ вызывай при буллинге, насилии, суицидальных мыслях, систематической изоляции — это сигналы для crisis_signal.
Этот инструмент НЕ создаёт сигналов и НЕ уведомляет психолога — это просто кнопка для ученика.
Поле reason пиши коротко на языке ученика — оно появится подписью карточки.`,
  inputSchema: z.object({
    reason: z.string(),
  }),
  outputSchema: z.object({
    hint: z.literal("psychologist_redirect"),
    reason: z.string(),
  }),
  execute: async (params) =>
    executePsychologistRedirect({ reason: (params as { reason: string }).reason }),
});
