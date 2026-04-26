import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError, ValidationError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { crisisFeedModule } from "./crisis-feed.module.js";

const crisisFeedPsychologistRouter = new Hono<{ Variables: AppVariables }>();

// GET /psychologist/crisis-signals?feed=red|yellow
crisisFeedPsychologistRouter.get("/", async (c) => {
  try {
    const feed = c.req.query("feed");
    if (feed !== "red" && feed !== "yellow") {
      throw new ValidationError("Query parameter 'feed' must be 'red' or 'yellow'");
    }
    const psychologistId = c.var.user.userId;
    const items =
      feed === "red"
        ? await crisisFeedModule.getRedFeed(psychologistId)
        : await crisisFeedModule.getYellowFeed(psychologistId);
    return c.json({ data: items });
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /psychologist/crisis-signals/history
crisisFeedPsychologistRouter.get("/history", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await crisisFeedModule.getHistory(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /psychologist/crisis-signals/counts → { red, yellow }
crisisFeedPsychologistRouter.get("/counts", async (c) => {
  try {
    const psychologistId = c.var.user.userId;
    const [red, yellow] = await Promise.all([
      crisisFeedModule.countActiveRed(psychologistId),
      crisisFeedModule.countActiveYellow(psychologistId),
    ]);
    return c.json({ red, yellow });
  } catch (err) {
    return handleError(c, err);
  }
});

// PATCH /psychologist/crisis-signals/:id/resolve
crisisFeedPsychologistRouter.patch("/:id/resolve", async (c) => {
  try {
    const body = await c.req.json();
    const result = await crisisFeedModule.resolve(
      c.var.user.userId,
      c.req.param("id"),
      {
        notes: typeof body.notes === "string" ? body.notes : null,
        contactedStudent: Boolean(body.contactedStudent),
        contactedParent: Boolean(body.contactedParent),
        documented: Boolean(body.documented),
      },
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { crisisFeedPsychologistRouter };
