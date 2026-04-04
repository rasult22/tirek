import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { contentService } from "./content.service.js";

const contentRouter = new Hono<{ Variables: AppVariables }>();

// GET /quote-of-the-day
contentRouter.get("/quote-of-the-day", async (c) => {
  try {
    const result = await contentService.getQuoteOfTheDay();
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /quotes
contentRouter.get("/quotes", async (c) => {
  try {
    const category = c.req.query("category");
    const pagination = parsePagination(c);
    const result = await contentService.listQuotes(pagination, category);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { contentRouter };
