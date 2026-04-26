import { v4 as uuidv4 } from "uuid";
import { ValidationError, NotFoundError, ForbiddenError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { journalRepository } from "./journal.repository.js";
import { productiveActionService } from "../productive-action/index.js";

const DAILY_PROMPTS = [
  { ru: "Сегодня я чувствую…", kz: "Бүгін мен сезінемін…" },
  { ru: "Три хороших вещи за день", kz: "Бүгінгі үш жақсы нәрсе" },
  { ru: "Что меня беспокоит", kz: "Мені не мазалайды" },
  { ru: "За что я благодарен/а", kz: "Мен неге ризамын" },
  { ru: "Моё настроение сейчас", kz: "Менің қазіргі көңіл-күйім" },
  { ru: "Что я хочу изменить", kz: "Мен нені өзгерткім келеді" },
  { ru: "Мой лучший момент за неделю", kz: "Апталық ең жақсы сәтім" },
];

export const journalService = {
  async create(userId: string, body: { prompt?: string; content: string }) {
    if (!body.content || body.content.trim().length === 0) {
      throw new ValidationError("Content cannot be empty");
    }

    const entry = await journalRepository.create({
      id: uuidv4(),
      userId,
      prompt: body.prompt?.trim() || undefined,
      content: body.content.trim(),
    });

    productiveActionService
      .recordProductiveAction(userId, "journal")
      .catch(() => {});

    return entry;
  },

  async list(userId: string, pagination: PaginationParams) {
    const [entries, total] = await Promise.all([
      journalRepository.findByUser(userId, pagination),
      journalRepository.countByUser(userId),
    ]);
    return paginated(entries, total, pagination);
  },

  async delete(userId: string, entryId: string) {
    const entry = await journalRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundError("Journal entry not found");
    }
    if (entry.userId !== userId) {
      throw new ForbiddenError("Access denied to this journal entry");
    }
    await journalRepository.deleteById(entryId);
    return { ok: true };
  },

  getDailyPrompt() {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const idx = dayOfYear % DAILY_PROMPTS.length;
    return DAILY_PROMPTS[idx];
  },
};
