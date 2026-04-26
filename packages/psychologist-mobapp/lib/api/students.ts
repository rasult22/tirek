import { tirekClient } from "./client";
import type {
  StudentsListFilters as StudentsFilters,
  StudentDetail,
} from "@tirek/shared/api";

export type { StudentsFilters, StudentDetail };

export const studentsApi = {
  getAll: (filters?: StudentsFilters) =>
    tirekClient.psychologist.students.list(filters),
  getOne: (id: string) => tirekClient.psychologist.students.get(id),
  detach: (id: string) => tirekClient.psychologist.students.detach(id),
};
