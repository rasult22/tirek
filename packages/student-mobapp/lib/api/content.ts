import { apiFetch } from "./client";
import type { ContentQuote, PaginatedResponse } from "@tirek/shared";

export const contentApi = {
  quoteOfTheDay: () => apiFetch<ContentQuote>("/student/quote-of-the-day"),

  quotes: () => apiFetch<PaginatedResponse<ContentQuote>>("/student/quotes"),
};
