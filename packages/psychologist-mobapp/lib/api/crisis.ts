import { apiFetch } from "./client";
import type { SOSEvent, FlaggedMessage, PaginatedResponse } from "@tirek/shared";

export interface ResolveData {
  notes: string;
  contactedStudent?: boolean;
  contactedParent?: boolean;
  documented?: boolean;
}

export const crisisApi = {
  getActive: () =>
    apiFetch<PaginatedResponse<SOSEvent>>("/psychologist/sos/active"),

  resolve: (id: string, data: ResolveData) =>
    apiFetch<SOSEvent>(`/psychologist/sos/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getHistory: () =>
    apiFetch<PaginatedResponse<SOSEvent>>("/psychologist/sos/history"),

  getFlaggedMessages: () =>
    apiFetch<PaginatedResponse<FlaggedMessage>>(
      "/psychologist/sos/flagged-messages",
    ),
};
