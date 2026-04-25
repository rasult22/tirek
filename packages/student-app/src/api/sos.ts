import { apiFetch } from "./client.js";
import type { SOSAction, SOSEvent } from "@tirek/shared";

export const sosApi = {
  trigger: (action: SOSAction) =>
    apiFetch<SOSEvent>("/student/sos", {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};
