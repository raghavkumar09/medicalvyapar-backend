import { Router } from "express";
import authController from "./auth.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);
router.get("/me", protect, authController.getCurrentUser);

export default router;