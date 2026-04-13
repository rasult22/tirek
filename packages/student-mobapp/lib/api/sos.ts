import { apiFetch } from "./client";
import type { SOSEvent } from "@tirek/shared";

export const sosApi = {
  trigger: (level: 1 | 2 | 3) =>
    apiFetch<SOSEvent>("/student/sos", {
      method: "POST",
      body: JSON.stringify({ level }),
    }),
};
