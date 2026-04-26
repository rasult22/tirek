import { tirekClient } from "./client.js";

export const getNotes = (studentId: string) =>
  tirekClient.psychologist.notes.getAll(studentId);

export const addNote = (studentId: string, data: { content: string }) =>
  tirekClient.psychologist.notes.add(studentId, data);

export const updateNote = (noteId: string, data: { content: string }) =>
  tirekClient.psychologist.notes.update(noteId, data);
