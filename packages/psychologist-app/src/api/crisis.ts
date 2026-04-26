import { tirekClient } from "./client.js";
import type { CrisisFeed } from "@tirek/shared";
import type { CrisisResolveData as ResolveData } from "@tirek/shared/api";

export type { ResolveData };

export const getFeed = (feed: CrisisFeed) =>
  tirekClient.psychologist.crisis.getFeed(feed);

export const getCounts = () => tirekClient.psychologist.crisis.getCounts();

export const resolve = (id: string, data: ResolveData) =>
  tirekClient.psychologist.crisis.resolve(id, data);

export const getHistory = () => tirekClient.psychologist.crisis.getHistory();
