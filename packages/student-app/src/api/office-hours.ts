import { apiFetch } from "./client.js";
import type { OfficeHoursInfoBlock } from "@tirek/shared";

export const officeHoursApi = {
  infoBlock: () =>
    apiFetch<OfficeHoursInfoBlock>("/office-hours/student/info-block"),
};
