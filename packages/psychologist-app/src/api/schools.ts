import { tirekClient } from "./client.js";

export const schoolsApi = {
  get: (id: string) => tirekClient.psychologist.schools.get(id),
};
