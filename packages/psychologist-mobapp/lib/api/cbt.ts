import { apiFetch } from "./client";
import type { CbtEntry, PaginatedResponse } from "@tirek/shared";

export const cbtApi = {
  getStudentEntries: (studentId: string, type?: string) =>
    apiFetch<PaginatedResponse<CbtEntry>>(
      `/psychologist/cbt/${studentId}${type ? `?type=${type}` : ""}`,
    ),
};
