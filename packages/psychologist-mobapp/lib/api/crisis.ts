import { tirekClient } from "./client";
import type { CrisisFeed } from "@tirek/shared";
import type { CrisisResolveData as ResolveData } from "@tirek/shared/api";

export type { ResolveData };

export const crisisApi = {
  getFeed: (feed: CrisisFeed) => tirekClient.psychologist.crisis.getFeed(feed),
  getCounts: () => tirekClient.psychologist.crisis.getCounts(),
  resolve: (id: string, data: ResolveData) =>
    tirekClient.psychologist.crisis.resolve(id, data),
  getHistory: () => tirekClient.psychologist.crisis.getHistory(),
};
