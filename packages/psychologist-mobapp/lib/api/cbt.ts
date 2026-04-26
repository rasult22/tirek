import { tirekClient } from "./client";

export const cbtApi = {
  getStudentEntries: (studentId: string, type?: string) =>
    tirekClient.psychologist.cbt.getStudentEntries(studentId, type),
};
