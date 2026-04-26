import { apiFetch } from "./client.js";
import type {
  CrisisFeed,
  CrisisFeedCounts,
  CrisisSignal,
  PaginatedResponse,
} from "@tirek/shared";

export function getFeed(feed: CrisisFeed) {
  return apiFetch<{ data: CrisisSignal[] }>(
    `/psychologist/crisis-signals?feed=${feed}`,
  );
}

export function getCounts() {
  return apiFetch<CrisisFeedCounts>("/psychologist/crisis-signals/counts");
}

export interface ResolveData {
  notes?: string;
  contactedStudent?: boolean;
  contactedParent?: boolean;
  documented?: boolean;
}

export function resolve(id: string, data: ResolveData) {
  return apiFetch<CrisisSignal>(
    `/psychologist/crisis-signals/${id}/resolve`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export function getHistory() {
  return apiFetch<PaginatedResponse<CrisisSignal>>(
    "/psychologist/crisis-signals/history",
  );
}
