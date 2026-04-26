import { tirekClient } from "./client";
import type {
  DiagnosticsFilters,
  DiagnosticResultRow,
  AssignTestData,
} from "@tirek/shared/api";

export type { DiagnosticsFilters, DiagnosticResultRow, AssignTestData };

export const diagnosticsApi = {
  getResults: (filters?: DiagnosticsFilters) =>
    tirekClient.psychologist.diagnostics.getResults(filters),
  assignTest: (data: AssignTestData) =>
    tirekClient.psychologist.diagnostics.assignTest(data),
  getReport: (sessionId: string) =>
    tirekClient.psychologist.diagnostics.getReport(sessionId),
  regenerateReport: (sessionId: string) =>
    tirekClient.psychologist.diagnostics.regenerateReport(sessionId),
  getSessionAnswers: (sessionId: string) =>
    tirekClient.psychologist.diagnostics.getSessionAnswers(sessionId),
};
