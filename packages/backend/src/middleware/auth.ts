import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import type { JwtPayload } from "../lib/jwt.js";
import { verifyToken } from "../lib/jwt.js";
import { ForbiddenError, UnauthorizedError } from "../shared/errors.js";

// ── Hono type augmentation ───────────────────────────────────────────
export type AppVariables = {
  user: JwtPayload;
};

// ── Public routes that skip auth ─────────────────────────────────────
const PUBLIC_PATTERNS = [
  /^\/auth\/register$/,
  /^\/auth\/register-psychologist$/,
  /^\/auth\/login$/,
  /^\/docs$/,
  /^\/openapi\.json$/,
  /^\/$/,
];

function isPublic(path: string): boolean {
  return PUBLIC_PATTERNS.some((p) => p.test(path));
}

// ── Auth middleware ──────────────────────────────────────────────────
export const authMiddleware = createMiddleware<{
  Variables: AppVariables;
}>(async (c: Context, next: Next) => {
  // Skip public endpoints
  if (isPublic(c.req.path)) {
    return next();
  }

  // Extract Bearer token
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Role-based route guards
  if (c.req.path.startsWith("/psychologist/")) {
    if (payload.role !== "psychologist" && payload.role !== "admin") {
      throw new ForbiddenError("Psychologist or admin role required");
    }
  }

  if (c.req.path.startsWith("/admin/")) {
    if (payload.role !== "admin") {
      throw new ForbiddenError("Admin role required");
    }
  }

  c.set("user", payload);
  return next();
});
