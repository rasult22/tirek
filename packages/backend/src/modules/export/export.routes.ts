import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { exportService } from "./export.service.js";

export const exportRouter = new Hono<{ Variables: AppVariables }>();

// GET /students/:id/csv — download student report as CSV
exportRouter.get("/students/:id/csv", async (c) => {
  try {
    const studentId = c.req.param("id");
    const csv = await exportService.generateStudentCSV(c.var.user.userId, studentId);
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="student-report-${studentId}.csv"`);
    return c.body(csv);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /class/csv?grade=X&classLetter=Y — download class report as CSV
exportRouter.get("/class/csv", async (c) => {
  try {
    const gradeStr = c.req.query("grade");
    const classLetter = c.req.query("classLetter");
    const grade = gradeStr ? parseInt(gradeStr, 10) : undefined;

    const csv = await exportService.generateClassCSV(
      c.var.user.userId,
      grade,
      classLetter || undefined,
    );

    const label = grade ? `${grade}${classLetter ?? ""}` : "all";
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="class-report-${label}.csv"`);
    return c.body(csv);
  } catch (err) {
    return handleError(c, err);
  }
});
