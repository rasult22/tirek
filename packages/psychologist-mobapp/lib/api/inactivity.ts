import { tirekClient } from "./client";

export const inactivityApi = {
  list: (threshold?: number) =>
    tirekClient.psychologist.inactivity.list(threshold),
};
