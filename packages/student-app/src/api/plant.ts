import { apiFetch } from "./client.js";
import type { PlantInfo } from "@tirek/shared";

export const plantApi = {
  get: () => apiFetch<PlantInfo>("/student/plant"),
  rename: (name: string) =>
    apiFetch<{ ok: boolean }>("/student/plant/name", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
};
