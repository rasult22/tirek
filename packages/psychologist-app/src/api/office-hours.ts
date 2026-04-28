import { tirekClient } from "./client.js";
import type { OfficeHoursDayOfWeek, OfficeHoursInterval } from "@tirek/shared";

export const officeHoursApi = {
  getTemplate: () => tirekClient.psychologist.officeHours.getTemplate(),
  upsertTemplateDay: (
    dayOfWeek: OfficeHoursDayOfWeek,
    intervals: OfficeHoursInterval[],
    notes: string | null,
  ) => tirekClient.psychologist.officeHours.upsertTemplateDay(dayOfWeek, intervals, notes),
  getOverrides: (from: string, to: string) =>
    tirekClient.psychologist.officeHours.getOverrides(from, to),
  upsertOverrideDay: (
    date: string,
    intervals: OfficeHoursInterval[],
    notes: string | null,
  ) => tirekClient.psychologist.officeHours.upsertOverrideDay(date, intervals, notes),
  deleteOverrideDay: (date: string) =>
    tirekClient.psychologist.officeHours.deleteOverrideDay(date),
  // Resolved view (shared endpoint).
  resolve: (psychologistId: string, date: string) =>
    tirekClient.officeHoursPublic.resolve(psychologistId, date),
};
