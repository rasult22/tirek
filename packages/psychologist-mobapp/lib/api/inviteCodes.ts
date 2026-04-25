import { apiFetch } from "./client";
import type { InviteCode, PaginatedResponse } from "@tirek/shared";

export interface GenerateCodesData {
  studentNames: string[];
  grade?: number;
  classLetter?: string;
}

export const inviteCodesApi = {
  generate: (data: GenerateCodesData) =>
    apiFetch<InviteCode[]>("/psychologist/invite-codes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: () =>
    apiFetch<PaginatedResponse<InviteCode>>(
      "/psychologist/invite-codes?limit=100",
    ),

  revoke: (id: string) =>
    apiFetch<{ success: boolean }>(`/psychologist/invite-codes/${id}`, {
      method: "DELETE",
    }),
};
