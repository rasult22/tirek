import { tirekClient } from "./client";
import type {
  DiagnosticsFilters,
  DiagnosticResultRow,
  AssignTestData,
  AssignmentsListFilters,
  TestAssignmentRow,
  TestAssignmentStatus,
} from "@tirek/shared/api";

export type {
  DiagnosticsFilters,
  DiagnosticResultRow,
  AssignTestData,
  AssignmentsListFilters,
  TestAssignmentRow,
  TestAssignmentStatus,
};

export const diagnosticsApi = {
  getResults: (filters?: DiagnosticsFilters) =>
    tirekClient.psychologist.diagnostics.getResults(filters),
  assignTest: (data: AssignTestData) =>
    tirekClient.psychologist.diagnostics.assignTest(data),
  listAssignments: (filters?: AssignmentsListFilters) =>
    tirekClient.psychologist.diagnostics.listAssignments(filters),
  cancelAssignment: (assignmentId: string) =>
    tirekClient.psychologist.diagnostics.cancelAssignment(assignmentId),
  getReport: (sessionId: string) =>
    tirekClient.psychologist.diagnostics.getReport(sessionId),
  regenerateReport: (sessionId: string) =>
    tirekClient.psychologist.diagnostics.regenerateReport(sessionId),
  getSessionAnswers: (sessionId: string) =>
    tirekClient.psychologist.diagnostics.getSessionAnswers(sessionId),
};
