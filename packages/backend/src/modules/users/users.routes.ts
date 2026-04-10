import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { usersService } from "./users.service.js";

const usersRouter = new Hono<{ Variables: AppVariables }>();

// GET /students - list students for psychologist
usersRouter.get("/students", async (c) => {
  try {
    const gradeParam = c.req.query("grade");
    const classLetter = c.req.query("classLetter");
    const pagination = parsePagination(c);

    const filters: { grade?: number; classLetter?: string } = {};
    if (gradeParam) {
      filters.grade = parseInt(gradeParam, 10);
    }
    if (classLetter) {
      filters.classLetter = classLetter;
    }

    const result = await usersService.getStudents(c.var.user.userId, pagination, filters);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /students/:id - get student detail
usersRouter.get("/students/:id", async (c) => {
  try {
    const result = await usersService.getStudentDetail(
      c.req.param("id"),
      c.var.user.userId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// DELETE /students/:id - detach student from psychologist
usersRouter.delete("/students/:id", async (c) => {
  try {
    await usersService.detachStudent(c.req.param("id"), c.var.user.userId);
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err);
  }
});

export { usersRouter };
