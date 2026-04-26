import { tirekClient } from "./client";
import type {
  ClassReportFilters,
  ClassReport,
  StudentReport,
} from "@tirek/shared/api";

export type { ClassReportFilters, ClassReport, StudentReport };

export const analyticsApi = {
  overview: () => tirekClient.psychologist.analytics.overview(),
  studentReport: (id: string) =>
    tirekClient.psychologist.analytics.studentReport(id),
  classReport: (filters?: ClassReportFilters) =>
    tirekClient.psychologist.analytics.classReport(filters),
};
