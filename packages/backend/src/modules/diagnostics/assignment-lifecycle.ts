export interface AssignmentRow {
  id: string;
  testId: string;
  assignedBy: string;
  targetType: string;
  targetGrade: number | null;
  targetClassLetter: string | null;
  targetStudentId: string | null;
  dueDate: Date | null;
  status: string;
  studentMessage: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export interface AssignmentInsertInput {
  id: string;
  testId: string;
  targetType: string;
  targetGrade?: number | null;
  targetClassLetter?: string | null;
  targetStudentId?: string | null;
  dueDate?: Date | null;
  studentMessage?: string | null;
}

export interface AssignmentListFilters {
  status?: string;
  studentId?: string;
}

export interface AssignmentLifecycleDeps {
  insertAssignment: (
    row: AssignmentRow,
  ) => Promise<AssignmentRow>;
  findAssignmentById: (id: string) => Promise<AssignmentRow | null>;
  updateAssignment: (
    id: string,
    patch: Partial<AssignmentRow>,
  ) => Promise<AssignmentRow | null>;
  findAssignmentsByPsychologist: (
    psychologistId: string,
    filters: AssignmentListFilters,
  ) => Promise<AssignmentRow[]>;
}

export interface AssignmentLifecycleModule {
  assignTest: (
    psychologistId: string,
    input: AssignmentInsertInput,
  ) => Promise<AssignmentRow>;
  cancelAssignment: (
    psychologistId: string,
    assignmentId: string,
  ) => Promise<AssignmentRow>;
  listAssignments: (
    psychologistId: string,
    filters: AssignmentListFilters,
  ) => Promise<AssignmentRow[]>;
}

import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../shared/errors.js";

export const STUDENT_MESSAGE_MAX_LENGTH = 500;

export function isActiveAssignment(row: AssignmentRow): boolean {
  return row.status !== "cancelled";
}


function normalizeStudentMessage(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > STUDENT_MESSAGE_MAX_LENGTH) {
    throw new ValidationError(
      `studentMessage must be ${STUDENT_MESSAGE_MAX_LENGTH} characters or fewer`,
    );
  }
  return trimmed;
}

export function createAssignmentLifecycle(
  deps: AssignmentLifecycleDeps,
): AssignmentLifecycleModule {
  return {
    async assignTest(psychologistId, input) {
      const studentMessage = normalizeStudentMessage(input.studentMessage);
      const row: AssignmentRow = {
        id: input.id,
        testId: input.testId,
        assignedBy: psychologistId,
        targetType: input.targetType,
        targetGrade: input.targetGrade ?? null,
        targetClassLetter: input.targetClassLetter ?? null,
        targetStudentId: input.targetStudentId ?? null,
        dueDate: input.dueDate ?? null,
        status: "pending",
        studentMessage,
        cancelledAt: null,
        createdAt: new Date(),
      };
      return deps.insertAssignment(row);
    },

    async cancelAssignment(psychologistId, assignmentId) {
      const existing = await deps.findAssignmentById(assignmentId);
      if (!existing) {
        throw new NotFoundError("Assignment not found");
      }
      if (existing.assignedBy !== psychologistId) {
        throw new ForbiddenError("You did not create this assignment");
      }
      if (existing.status === "cancelled") {
        throw new ConflictError("Assignment already cancelled");
      }
      const updated = await deps.updateAssignment(assignmentId, {
        status: "cancelled",
        cancelledAt: new Date(),
      });
      if (!updated) {
        throw new NotFoundError("Assignment not found");
      }
      return updated;
    },

    async listAssignments(psychologistId, filters) {
      return deps.findAssignmentsByPsychologist(psychologistId, filters);
    },
  };
}
