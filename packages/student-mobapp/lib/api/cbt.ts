import { apiFetch } from "./client";
import type { CbtEntry, CbtType, PaginatedResponse } from "@tirek/shared";

export const cbtApi = {
  list: (type?: CbtType) =>
    apiFetch<PaginatedResponse<CbtEntry>>(
      `/student/cbt${type ? `?type=${type}` : ""}`,
    ),

  create: (data: { type: CbtType; data: Record<string, unknown> }) =>
    apiFetch<CbtEntry>("/student/cbt", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<CbtEntry>(`/student/cbt/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/student/cbt/${id}`, { method: "DELETE" }),
};
