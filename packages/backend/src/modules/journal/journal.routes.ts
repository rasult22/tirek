import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { journalService } from "./journal.service.js";

export const journalRouter = new Hono<{ Variables: AppVariables }>();

// GET / — list journal entries (paginated)
journalRouter.get("/", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await journalService.list(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST / — create journal entry
journalRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = await journalService.create(c.var.user.userId, body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /prompt — get daily prompt
journalRouter.get("/prompt", async (c) => {
  try {
    const prompt = journalService.getDailyPrompt();
    return c.json(prompt);
  } catch (err) {
    return handleError(c, err);
  }
});

// DELETE /:id — delete journal entry
journalRouter.delete("/:id", async (c) => {
  try {
    const result = await journalService.delete(c.var.user.userId, c.req.param("id"));
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});
