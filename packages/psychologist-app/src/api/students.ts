import { tirekClient } from "./client.js";
import type {
  StudentsListFilters as StudentsFilters,
  StudentDetail,
  AtRiskStudent,
} from "@tirek/shared/api";

export type { StudentsFilters, StudentDetail, AtRiskStudent };

export const getStudents = (filters?: StudentsFilters) =>
  tirekClient.psychologist.students.list(filters);

export const getStudent = (id: string) =>
  tirekClient.psychologist.students.get(id);

export const detachStudent = (id: string) =>
  tirekClient.psychologist.students.detach(id);

export const getAtRiskStudents = () =>
  tirekClient.psychologist.students.atRisk();
