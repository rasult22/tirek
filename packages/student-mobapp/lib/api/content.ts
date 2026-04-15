import { apiFetch } from "./client";
import type { ContentQuote, PaginatedResponse } from "@tirek/shared";

export const contentApi = {
  quoteOfTheDay: () => apiFetch<ContentQuote>("/student/quote-of-the-day"),

  quotes: (category?: string) =>
    apiFetch<PaginatedResponse<ContentQuote>>(
      `/student/quotes${category ? `?category=${category}&limit=50` : "?limit=50"}`,
    ),
};
