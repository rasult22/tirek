import { apiFetch } from "./client.js";
import type { PsychologistNote, PaginatedResponse } from "@tirek/shared";

export function getNotes(studentId: string) {
  return apiFetch<PaginatedResponse<PsychologistNote>>(`/psychologist/students/${studentId}/notes?limit=100`);
}

export function addNote(studentId: string, data: { content: string }) {
  return apiFetch<PsychologistNote>(`/psychologist/students/${studentId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateNote(noteId: string, data: { content: string }) {
  return apiFetch<PsychologistNote>(`/psychologist/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
