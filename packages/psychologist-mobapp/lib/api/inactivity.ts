import { apiFetch } from "./client";
import type { InactiveStudent } from "@tirek/shared";

export const inactivityApi = {
  list: (threshold?: number) => {
    const qs = threshold !== undefined ? `?threshold=${threshold}` : "";
    return apiFetch<{ data: InactiveStudent[] }>(
      `/psychologist/inactive-students${qs}`,
    );
  },
};
