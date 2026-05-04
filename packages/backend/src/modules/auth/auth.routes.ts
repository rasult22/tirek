import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { authService } from "./auth.singleton.js";
import { passwordResetService } from "./password-reset.singleton.js";

const authRouter = new Hono<{ Variables: AppVariables }>();

// POST /register
authRouter.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const result = await authService.register(body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /register-psychologist
authRouter.post("/register-psychologist", async (c) => {
  try {
    const body = await c.req.json();
    const result = await authService.registerPsychologist(body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /login
authRouter.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const result = await authService.login(body);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /me
authRouter.get("/me", async (c) => {
  try {
    const result = await authService.me(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /forgot-password
authRouter.post("/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const result = await passwordResetService.requestCode(body);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /verify-reset-code
authRouter.post("/verify-reset-code", async (c) => {
  try {
    const body = await c.req.json();
    const result = await passwordResetService.verifyCode(body);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /reset-password
authRouter.post("/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const result = await passwordResetService.resetPassword(body);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// PATCH /profile
authRouter.patch("/profile", async (c) => {
  try {
    const body = await c.req.json();
    const result = await authService.updateProfile(c.var.user.userId, body);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { authRouter };
