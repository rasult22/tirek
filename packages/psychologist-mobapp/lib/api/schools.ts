import { tirekClient } from "./client";

export const schoolsApi = {
  get: (id: string) => tirekClient.psychologist.schools.get(id),
};
