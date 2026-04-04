import type { Context } from "hono";

// ── Base error ───────────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ── Concrete errors ──────────────────────────────────────────────────
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(400, "VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

export class AIError extends AppError {
  constructor(message = "AI service error") {
    super(500, "AI_ERROR", message);
    this.name = "AIError";
  }
}

// ── Unified error handler ────────────────────────────────────────────
export function handleError(c: Context, err: unknown) {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 500,
    );
  }

  console.error("Unhandled error:", err);

  const message =
    err instanceof Error ? err.message : "Internal server error";
  return c.json(
    { error: { code: "INTERNAL_ERROR", message } },
    500,
  );
}
