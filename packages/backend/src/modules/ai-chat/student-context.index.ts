import { createStudentContext } from "./student-context.js";
import { studentContextDeps } from "./student-context.deps.js";

export const studentContext = createStudentContext(studentContextDeps);

export type { StudentContextSnapshot } from "./student-context.js";
