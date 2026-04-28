import { v4 as uuidv4 } from "uuid";
import { officeHoursRepository } from "./office-hours.repository.js";
import { createOfficeHoursService } from "./office-hours.factory.js";

// ── Production singleton (wires the real repository) ──────────────────

export const officeHoursService = createOfficeHoursService({
  findTemplateByPsychologist: (id) => officeHoursRepository.findTemplateByPsychologist(id),
  upsertTemplateDay: (data) =>
    officeHoursRepository.upsertTemplateDay({ id: uuidv4(), ...data }),
  findOverridesByRange: (id, from, to) =>
    officeHoursRepository.findOverridesByRange(id, from, to),
  upsertOverrideDay: (data) =>
    officeHoursRepository.upsertOverrideDay({ id: uuidv4(), ...data }),
  deleteOverrideDay: (id, date) => officeHoursRepository.deleteOverrideDay(id, date),
  findStudentPsychologistLink: (id) => officeHoursRepository.findStudentPsychologistLink(id),
});
