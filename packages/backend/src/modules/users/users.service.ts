import { NotFoundError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { usersRepository } from "./users.repository.js";

export const usersService = {
  async getStudents(
    psychologistId: string,
    pagination: PaginationParams,
    filters?: { grade?: number; classLetter?: string },
  ) {
    const [students, total] = await Promise.all([
      usersRepository.findStudentsByPsychologist(psychologistId, pagination, filters),
      usersRepository.countStudentsByPsychologist(psychologistId, filters),
    ]);

    return paginated(students, total, pagination);
  },

  async getStudentDetail(studentId: string, psychologistId: string) {
    const student = await usersRepository.findStudentById(studentId, psychologistId);
    if (!student) {
      throw new NotFoundError("Student not found or not linked to this psychologist");
    }
    return student;
  },
};
