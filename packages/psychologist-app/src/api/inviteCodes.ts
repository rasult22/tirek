import { apiFetch } from "./client.js";
import type { InviteCode, PaginatedResponse } from "@tirek/shared";

export interface GenerateCodesData {
  count: number;
  grade?: number;
  classLetter?: string;
}

export function generate(data: GenerateCodesData) {
  return apiFetch<InviteCode[]>("/psychologist/invite-codes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function list() {
  return apiFetch<PaginatedResponse<InviteCode>>("/psychologist/invite-codes?limit=100");
}

export function revoke(id: string) {
  return apiFetch<{ success: boolean }>(`/psychologist/invite-codes/${id}`, {
    method: "DELETE",
  });
}
