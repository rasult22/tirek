import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppVariables } from "../../middleware/auth.js";
import { db } from "../../db/index.js";
import { schools } from "../../db/schema.js";
import { handleError, NotFoundError } from "../../shared/errors.js";

const schoolsRouter = new Hono<{ Variables: AppVariables }>();

// GET /psychologist/schools/:id - get school metadata (psychologist-only via /psychologist/* guard)
schoolsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const rows = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);
    const school = rows[0];
    if (!school) throw new NotFoundError("School not found");
    return c.json(school);
  } catch (err) {
    return handleError(c, err);
  }
});

export { schoolsRouter };
