import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import env from "../config/env.js";
import prisma from "../config/db.js";

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "OWNER" | "ADMIN" | "MANAGER" | "SALESMAN" | "PACKER";
    ownerId?: string;
    shopId?: string;
  };
}

interface JwtPayload {
  userId: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "SALESMAN" | "PACKER";
  ownerId?: string;
  shopId?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication middleware.
 * Verifies the Bearer token and attaches the user to req.user.
 */
export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Access token is required");
  }

  const token = authHeader.split(" ")[1]!;

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    // Verify user still exists
    const owner = await prisma.owner.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!owner || !owner.isActive) {
      throw ApiError.unauthorized("User account is deactivated or not found");
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      ownerId: decoded.ownerId,
      shopId: decoded.shopId,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === "TokenExpiredError") {
      throw ApiError.unauthorized("Access token has expired");
    }
    throw ApiError.unauthorized("Invalid access token");
  }
};

/**
 * Role-based access control middleware.
 * Must be used AFTER `protect` middleware.
 * Usage: router.get("/", protect, authorize("OWNER", "ADMIN"), handler)
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};
