import { Router } from "express";
import authController from "./auth.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../../utils/validators.js";

const router = Router();

// Public routes (rate-limited)
router.post("/send-otp", authLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.me);

export default router;