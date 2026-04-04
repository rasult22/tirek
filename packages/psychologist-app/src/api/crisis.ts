import { apiFetch } from "./client.js";
import type { SOSEvent, FlaggedMessage, PaginatedResponse } from "@tirek/shared";

export function getActive() {
  return apiFetch<PaginatedResponse<SOSEvent>>("/psychologist/sos/active");
}

export interface ResolveData {
  notes: string;
  contactedStudent?: boolean;
  contactedParent?: boolean;
  documented?: boolean;
}

export function resolve(id: string, data: ResolveData) {
  return apiFetch<SOSEvent>(`/psychologist/sos/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getHistory() {
  return apiFetch<PaginatedResponse<SOSEvent>>("/psychologist/sos/history");
}

export function getFlaggedMessages() {
  return apiFetch<PaginatedResponse<FlaggedMessage>>("/psychologist/sos/flagged-messages");
}
