import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Validates request body, query, or params against a Zod schema.
 * Usage: router.post("/", validate(mySchema), controller.handler)
 */
export const validate = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      throw new ApiError(400, "Validation failed", errors);
    }

    // Replace the source with parsed (coerced/transformed) data
    (req as any)[source] = result.data;
    next();
  };
};
