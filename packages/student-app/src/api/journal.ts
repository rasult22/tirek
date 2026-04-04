import { apiFetch } from "./client.js";
import type { JournalEntry, DailyPrompt, PaginatedResponse } from "@tirek/shared";

export const journalApi = {
  list: () => apiFetch<PaginatedResponse<JournalEntry>>("/student/journal"),

  create: (data: { prompt?: string; content: string }) =>
    apiFetch<JournalEntry>("/student/journal", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/student/journal/${id}`, { method: "DELETE" }),

  dailyPrompt: () => apiFetch<DailyPrompt>("/student/journal/prompt"),
};
