import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express route handler to automatically catch errors
 * and forward them to the global error middleware via next().
 */
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
