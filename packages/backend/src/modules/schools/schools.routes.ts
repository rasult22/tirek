import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AppVariables } from "../../middleware/auth.js";
import { db } from "../../db/index.js";
import { schools } from "../../db/schema.js";
import {
  handleError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors.js";

const schoolsRouter = new Hono<{ Variables: AppVariables }>();

// GET /psychologist/schools/:id - get school metadata (psychologist-only via /psychologist/* guard)
schoolsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const rows = await db
      .select({ id: schools.id, name: schools.name, city: schools.city })
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

// POST /psychologist/schools - create a school via free-text input (онбординг)
schoolsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<{ name?: string; city?: string | null }>();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw new ValidationError("School name is required");

    const cityRaw = typeof body.city === "string" ? body.city.trim() : "";
    const city = cityRaw.length > 0 ? cityRaw : null;

    const [school] = await db
      .insert(schools)
      .values({ id: randomUUID(), name, city })
      .returning({ id: schools.id, name: schools.name, city: schools.city });

    return c.json(school, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

export { schoolsRouter };
