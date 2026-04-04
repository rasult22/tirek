import { v4 as uuidv4 } from "uuid";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { notesRepository } from "./psychologist-notes.repository.js";

export const notesService = {
  async addNote(
    psychologistId: string,
    studentId: string,
    body: { content: string },
  ) {
    if (!body.content || body.content.trim().length === 0) {
      throw new ValidationError("Note content cannot be empty");
    }

    return notesRepository.create({
      id: uuidv4(),
      psychologistId,
      studentId,
      content: body.content,
    });
  },

  async getNotes(
    psychologistId: string,
    studentId: string,
    pagination: PaginationParams,
  ) {
    const [notes, total] = await Promise.all([
      notesRepository.findByStudent(psychologistId, studentId, pagination),
      notesRepository.countByStudent(psychologistId, studentId),
    ]);
    return paginated(notes, total, pagination);
  },

  async updateNote(
    psychologistId: string,
    noteId: string,
    body: { content: string },
  ) {
    if (!body.content || body.content.trim().length === 0) {
      throw new ValidationError("Note content cannot be empty");
    }

    const note = await notesRepository.findById(noteId);
    if (!note) {
      throw new NotFoundError("Note not found");
    }

    if (note.psychologistId !== psychologistId) {
      throw new ForbiddenError("Access denied to this note");
    }

    return notesRepository.update(noteId, body.content);
  },
};
