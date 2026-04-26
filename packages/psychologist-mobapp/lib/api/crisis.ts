import { apiFetch } from "./client";
import type {
  CrisisFeed,
  CrisisFeedCounts,
  CrisisSignal,
  PaginatedResponse,
} from "@tirek/shared";

export interface ResolveData {
  notes?: string;
  contactedStudent?: boolean;
  contactedParent?: boolean;
  documented?: boolean;
}

export const crisisApi = {
  getFeed: (feed: CrisisFeed) =>
    apiFetch<{ data: CrisisSignal[] }>(
      `/psychologist/crisis-signals?feed=${feed}`,
    ),

  getCounts: () => apiFetch<CrisisFeedCounts>("/psychologist/crisis-signals/counts"),

  resolve: (id: string, data: ResolveData) =>
    apiFetch<CrisisSignal>(`/psychologist/crisis-signals/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getHistory: () =>
    apiFetch<PaginatedResponse<CrisisSignal>>(
      "/psychologist/crisis-signals/history",
    ),
};
