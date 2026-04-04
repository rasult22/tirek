import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { notesService } from "./psychologist-notes.service.js";

const notesRouter = new Hono<{ Variables: AppVariables }>();

// POST /students/:studentId/notes - add note
notesRouter.post("/students/:studentId/notes", async (c) => {
  try {
    const body = await c.req.json();
    const result = await notesService.addNote(
      c.var.user.userId,
      c.req.param("studentId"),
      body,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /students/:studentId/notes - get notes
notesRouter.get("/students/:studentId/notes", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await notesService.getNotes(
      c.var.user.userId,
      c.req.param("studentId"),
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// PUT /notes/:noteId - update note
notesRouter.put("/notes/:noteId", async (c) => {
  try {
    const body = await c.req.json();
    const result = await notesService.updateNote(
      c.var.user.userId,
      c.req.param("noteId"),
      body,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { notesRouter };
