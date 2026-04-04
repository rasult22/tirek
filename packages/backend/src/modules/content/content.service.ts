import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { contentRepository } from "./content.repository.js";

export const contentService = {
  async getQuoteOfTheDay() {
    const total = await contentRepository.countAll();
    if (total === 0) {
      return null;
    }

    // Deterministic daily quote: use day-of-year as hash
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    const offset = dayOfYear % total;
    return contentRepository.findByOffset(offset);
  },

  async listQuotes(pagination: PaginationParams, category?: string) {
    const [quotes, total] = await Promise.all([
      contentRepository.findAll(pagination, category),
      contentRepository.countAll(category),
    ]);
    return paginated(quotes, total, pagination);
  },
};
