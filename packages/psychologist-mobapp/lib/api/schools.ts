import { tirekClient } from "./client";

export const schoolsApi = {
  get: (id: string) => tirekClient.psychologist.schools.get(id),
  create: (data: { name: string; city?: string | null }) =>
    tirekClient.psychologist.schools.create(data),
};
