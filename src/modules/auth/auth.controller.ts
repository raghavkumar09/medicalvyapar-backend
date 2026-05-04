import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import authService from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

class AuthController {
  sendOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.sendOtp(req.body);
    res.status(200).json(new ApiResponse(200, "OTP sent successfully", result));
  });

  verifyOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.verifyOtp(req.body);
    res.status(200).json(new ApiResponse(200, "OTP verified", result));
  });

  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(new ApiResponse(201, "Registration successful", result));
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json(new ApiResponse(200, "Login successful", result));
  });

  refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json(new ApiResponse(200, "Token refreshed", result));
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.logout(req.user!.id);
    res.status(200).json(new ApiResponse(200, "Logged out", result));
  });

  me = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.getCurrentUser(req.user!.id);
    res.status(200).json(new ApiResponse(200, "User profile", result));
  });
}

const authController = new AuthController();
export default authController;