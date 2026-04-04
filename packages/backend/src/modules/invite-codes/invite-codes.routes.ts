import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { inviteCodesService } from "./invite-codes.service.js";

const inviteCodesRouter = new Hono<{ Variables: AppVariables }>();

// POST / - generate codes
inviteCodesRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = await inviteCodesService.generate(c.var.user.userId, body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET / - list codes
inviteCodesRouter.get("/", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await inviteCodesService.list(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// DELETE /:id - revoke code
inviteCodesRouter.delete("/:id", async (c) => {
  try {
    const result = await inviteCodesService.revoke(
      c.var.user.userId,
      c.req.param("id"),
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { inviteCodesRouter };
