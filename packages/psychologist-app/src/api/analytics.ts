import { tirekClient } from "./client.js";
import type { ClassReportFilters, ClassReport, StudentReport } from "@tirek/shared/api";

export type { ClassReportFilters, ClassReport, StudentReport };

export const overview = () => tirekClient.psychologist.analytics.overview();

export const studentReport = (id: string) =>
  tirekClient.psychologist.analytics.studentReport(id);

export const classReport = (filters?: ClassReportFilters) =>
  tirekClient.psychologist.analytics.classReport(filters);
