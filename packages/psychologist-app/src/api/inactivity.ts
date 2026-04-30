import { tirekClient } from "./client.js";
import type { InactiveStudent } from "@tirek/shared";

export type { InactiveStudent };

export const inactivityApi = {
  list: (threshold?: number) =>
    tirekClient.psychologist.inactivity.list(threshold),
};
