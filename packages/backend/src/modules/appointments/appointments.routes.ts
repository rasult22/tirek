import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { appointmentsService } from "./appointments.service.js";

// ── Student routes (mounted at /student/appointments) ─────────────

const appointmentsStudentRouter = new Hono<{ Variables: AppVariables }>();

// GET /slots?from=&to= — available slots for student's psychologist
appointmentsStudentRouter.get("/slots", async (c) => {
  try {
    const from = c.req.query("from") ?? "";
    const to = c.req.query("to") ?? "";
    const result = await appointmentsService.getAvailableSlots(
      c.var.user.userId,
      from,
      to,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /next — next upcoming appointment (dashboard widget)
appointmentsStudentRouter.get("/next", async (c) => {
  try {
    const result = await appointmentsService.getNextAppointment(
      c.var.user.userId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET / — my appointments (paginated)
appointmentsStudentRouter.get("/", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await appointmentsService.getStudentAppointments(
      c.var.user.userId,
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST / — book an appointment
appointmentsStudentRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = await appointmentsService.bookAppointment(
      c.var.user.userId,
      body,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// DELETE /:id — cancel appointment
appointmentsStudentRouter.delete("/:id", async (c) => {
  try {
    const result = await appointmentsService.cancelAppointment(
      c.var.user.userId,
      c.req.param("id"),
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// ── Psychologist routes (mounted at /psychologist/appointments) ───

const appointmentsPsychologistRouter = new Hono<{
  Variables: AppVariables;
}>();

// POST /slots — create slots (batch)
appointmentsPsychologistRouter.post("/slots", async (c) => {
  try {
    const body = await c.req.json();
    const result = await appointmentsService.createSlots(
      c.var.user.userId,
      body.slots,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /slots?from=&to= — list own slots
appointmentsPsychologistRouter.get("/slots", async (c) => {
  try {
    const from = c.req.query("from") ?? "";
    const to = c.req.query("to") ?? "";
    const result = await appointmentsService.getSlots(
      c.var.user.userId,
      from,
      to,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// DELETE /slots/:id — delete unbooked slot
appointmentsPsychologistRouter.delete("/slots/:id", async (c) => {
  try {
    const result = await appointmentsService.deleteSlot(
      c.var.user.userId,
      c.req.param("id"),
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET / — list appointments (paginated)
appointmentsPsychologistRouter.get("/", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await appointmentsService.getPsychologistAppointments(
      c.var.user.userId,
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// PATCH /:id/status — update appointment status
appointmentsPsychologistRouter.patch("/:id/status", async (c) => {
  try {
    const body = await c.req.json();
    const result = await appointmentsService.updateStatus(
      c.var.user.userId,
      c.req.param("id"),
      body.status,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { appointmentsStudentRouter, appointmentsPsychologistRouter };
