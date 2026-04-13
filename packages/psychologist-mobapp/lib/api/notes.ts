import { apiFetch } from "./client";
import type { PsychologistNote, PaginatedResponse } from "@tirek/shared";

export const notesApi = {
  getAll: (studentId: string) =>
    apiFetch<PaginatedResponse<PsychologistNote>>(
      `/psychologist/students/${studentId}/notes?limit=100`,
    ),

  add: (studentId: string, data: { content: string }) =>
    apiFetch<PsychologistNote>(`/psychologist/students/${studentId}/notes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (noteId: string, data: { content: string }) =>
    apiFetch<PsychologistNote>(`/psychologist/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
