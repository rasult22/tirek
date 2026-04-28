import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError, ValidationError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { timelineService } from "./timeline.service.js";
import type { TimelineEventType } from "./timeline.js";

const TIMELINE_TYPES: TimelineEventType[] = [
  "mood",
  "test",
  "cbt",
  "message",
  "crisis",
];

function parseType(raw: string | undefined): TimelineEventType | undefined {
  if (!raw || raw === "all") return undefined;
  if ((TIMELINE_TYPES as string[]).includes(raw)) {
    return raw as TimelineEventType;
  }
  throw new ValidationError(
    `Invalid type "${raw}". Allowed: all, ${TIMELINE_TYPES.join(", ")}`,
  );
}

export const timelinePsychologistRouter = new Hono<{ Variables: AppVariables }>();

// GET /students/:id/timeline
timelinePsychologistRouter.get("/students/:id/timeline", async (c) => {
  try {
    const studentId = c.req.param("id");
    const pagination = parsePagination(c);
    const type = parseType(c.req.query("type"));

    const result = await timelineService.getStudentTimeline(
      c.var.user.userId,
      studentId,
      pagination,
      type,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});
