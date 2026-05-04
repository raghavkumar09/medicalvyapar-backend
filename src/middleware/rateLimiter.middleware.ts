import rateLimit from "express-rate-limit";
import env from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * General API rate limiter.
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw ApiError.tooManyRequests("Too many requests, please try again later");
  },
});

/**
 * Stricter rate limiter for auth endpoints (OTP, login, register).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw ApiError.tooManyRequests(
      "Too many authentication attempts, please try again after 15 minutes"
    );
  },
});
