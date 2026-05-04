import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import env from "../config/env.js";

/**
 * Global error handling middleware.
 * Catches all errors thrown in route handlers and sends a consistent JSON response.
 */
export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: Record<string, string>[] = [];
  let stack: string | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation error";
    // Zod errors have an `issues` property
    const zodErr = err as unknown as { issues: Array<{ path: string[]; message: string }> };
    errors = zodErr.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };
    switch (prismaErr.code) {
      case "P2002":
        statusCode = 409;
        message = `Duplicate value for: ${prismaErr.meta?.target?.join(", ") ?? "unknown field"}`;
        break;
      case "P2025":
        statusCode = 404;
        message = "Record not found";
        break;
      default:
        statusCode = 400;
        message = "Database operation failed";
    }
  } else {
    message = err.message || message;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${statusCode} - ${message}`);
  }

  // Include stack trace only in development
  if (env.NODE_ENV === "development") {
    stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack,
  });
};
