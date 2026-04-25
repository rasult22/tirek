import { apiFetch } from "./client.js";
import type {
  OfficeHoursEntry,
  OfficeHoursInterval,
} from "@tirek/shared";

export const officeHoursApi = {
  getByDate: (psychologistId: string, date: string) =>
    apiFetch<OfficeHoursEntry | null>(
      `/office-hours/${psychologistId}?date=${date}`,
    ),

  getRange: (psychologistId: string, from: string, to: string) =>
    apiFetch<OfficeHoursEntry[]>(
      `/office-hours/${psychologistId}?from=${from}&to=${to}`,
    ),

  upsert: (date: string, intervals: OfficeHoursInterval[], notes: string | null) =>
    apiFetch<OfficeHoursEntry>("/psychologist/office-hours", {
      method: "PUT",
      body: JSON.stringify({ date, intervals, notes }),
    }),
};
