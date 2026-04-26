import { tirekClient } from "./client";

export const notesApi = {
  getAll: (studentId: string) =>
    tirekClient.psychologist.notes.getAll(studentId),
  add: (studentId: string, data: { content: string }) =>
    tirekClient.psychologist.notes.add(studentId, data),
  update: (noteId: string, data: { content: string }) =>
    tirekClient.psychologist.notes.update(noteId, data),
};
