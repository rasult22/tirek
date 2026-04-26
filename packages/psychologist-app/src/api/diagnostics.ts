import { tirekClient } from "./client.js";
import type {
  DiagnosticsFilters,
  DiagnosticResultRow,
  AssignTestData,
} from "@tirek/shared/api";

export type { DiagnosticsFilters, DiagnosticResultRow, AssignTestData };

export const getResults = (filters?: DiagnosticsFilters) =>
  tirekClient.psychologist.diagnostics.getResults(filters);

export const assignTest = (data: AssignTestData) =>
  tirekClient.psychologist.diagnostics.assignTest(data);

export const getReport = (sessionId: string) =>
  tirekClient.psychologist.diagnostics.getReport(sessionId);

export const regenerateReport = (sessionId: string) =>
  tirekClient.psychologist.diagnostics.regenerateReport(sessionId);

export const getSessionAnswers = (sessionId: string) =>
  tirekClient.psychologist.diagnostics.getSessionAnswers(sessionId);
