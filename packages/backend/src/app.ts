import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { authMiddleware, type AppVariables } from "./middleware/auth.js";
import { handleError } from "./shared/errors.js";

// ── Module routers ──────────────────────────────────────────────────
import { authRouter } from "./modules/auth/auth.routes.js";
import { inviteCodesRouter } from "./modules/invite-codes/invite-codes.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { moodRouter } from "./modules/mood/mood.routes.js";
import { diagnosticsRouter } from "./modules/diagnostics/diagnostics.routes.js";
import { diagnosticsPsychologistRouter } from "./modules/diagnostics/diagnostics-psychologist.routes.js";
import { exercisesRouter } from "./modules/exercises/exercises.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";
import { sosStudentRouter, sosPsychologistRouter } from "./modules/sos/sos.routes.js";
import { aiChatRouter } from "./modules/ai-chat/ai-chat.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { notesRouter } from "./modules/psychologist-notes/psychologist-notes.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";

export const app = new Hono<{ Variables: AppVariables }>();

// ── CORS ─────────────────────────────────────────────────────────────
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Auth ─────────────────────────────────────────────────────────────
app.use("*", authMiddleware);

// ── Health check ─────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", name: "Tirek API" }));

// ── Swagger UI ───────────────────────────────────────────────────────
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

// ── Routes ───────────────────────────────────────────────────────────
// Auth
app.route("/auth", authRouter);

// Student routes
app.route("/student/mood", moodRouter);
app.route("/student/tests", diagnosticsRouter);
app.route("/student/exercises", exercisesRouter);
app.route("/student/sos", sosStudentRouter);
app.route("/student/chat", aiChatRouter);
app.route("/student", contentRouter);

// Psychologist routes
app.route("/psychologist/invite-codes", inviteCodesRouter);
app.route("/psychologist/diagnostics", diagnosticsPsychologistRouter);
app.route("/psychologist/sos", sosPsychologistRouter);
app.route("/psychologist/analytics", analyticsRouter);
app.route("/psychologist", usersRouter);
app.route("/psychologist", notesRouter);

// Shared routes
app.route("/notifications", notificationsRouter);

// ── Global error handler ─────────────────────────────────────────────
app.onError((err, c) => handleError(c, err));
