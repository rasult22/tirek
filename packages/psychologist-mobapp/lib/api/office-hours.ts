import { tirekClient } from "./client";
import type { OfficeHoursInterval } from "@tirek/shared";

export const officeHoursApi = {
  getByDate: (psychologistId: string, date: string) =>
    tirekClient.officeHoursPublic.getByDate(psychologistId, date),
  getRange: (psychologistId: string, from: string, to: string) =>
    tirekClient.officeHoursPublic.getRange(psychologistId, from, to),
  upsert: (date: string, intervals: OfficeHoursInterval[], notes: string | null) =>
    tirekClient.psychologist.officeHours.upsert(date, intervals, notes),
};
