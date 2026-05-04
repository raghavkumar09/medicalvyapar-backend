import authRepository from "./auth.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOtp,
  getOtpExpiry,
} from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import type {
  RegisterInput,
  LoginInput,
  SendOtpInput,
  VerifyOtpInput,
} from "../../utils/validators.js";

export class AuthService {
  // ── Send OTP ────────────────────────────────────────────

  async sendOtp(data: SendOtpInput) {
    const code = generateOtp();
    const expiresAt = getOtpExpiry();

    // Find owner if exists (for linking)
    const owner = await authRepository.findOwnerByMobile(data.mobileNo);

    await authRepository.createOtp({
      code,
      type: data.type,
      target: data.mobileNo,
      expiresAt,
      ...(owner ? { owner: { connect: { id: owner.id } } } : {}),
    });

    // In production, integrate with SMS gateway (MSG91, Twilio, etc.)
    // For now, log the OTP in development
    logger.info(`OTP for ${data.mobileNo}: ${code} (expires: ${expiresAt.toISOString()})`);

    return {
      message: "OTP sent successfully",
      // Only include OTP in development for testing
      ...(process.env["NODE_ENV"] === "development" ? { otp: code } : {}),
    };
  }

  // ── Verify OTP ──────────────────────────────────────────

  async verifyOtp(data: VerifyOtpInput) {
    const otp = await authRepository.findLatestOtp(data.mobileNo, "LOGIN");

    if (!otp) {
      throw ApiError.badRequest("No valid OTP found. Please request a new one.");
    }

    if (otp.attempts >= 5) {
      await authRepository.markOtpUsed(otp.id);
      throw ApiError.tooManyRequests("Too many OTP attempts. Please request a new OTP.");
    }

    if (otp.code !== data.code) {
      await authRepository.incrementOtpAttempts(otp.id);
      throw ApiError.badRequest("Invalid OTP");
    }

    await authRepository.markOtpUsed(otp.id);

    return { message: "OTP verified successfully", verified: true };
  }

  // ── Register ────────────────────────────────────────────

  async register(data: RegisterInput) {
    // Check if owner already exists
    const existingByMobile = await authRepository.findOwnerByMobile(data.mobileNo);
    if (existingByMobile) {
      throw ApiError.conflict("Mobile number is already registered");
    }

    const existingByEmail = await authRepository.findOwnerByEmail(data.email);
    if (existingByEmail) {
      throw ApiError.conflict("Email is already registered");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create owner
    const owner = await authRepository.createOwner({
      name: data.name,
      email: data.email,
      mobileNo: data.mobileNo,
      password: hashedPassword,
      licenseNumber: data.licenseNumber,
      gstNumber: data.gstNumber,
      isMobileNoVerified: true, // Verified via OTP before registration
    });

    // Generate tokens
    const tokenPayload = { userId: owner.id, role: "OWNER" as const };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await authRepository.updateRefreshToken(owner.id, refreshToken);

    logger.info(`New owner registered: ${owner.id} (${owner.mobileNo})`);

    return {
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        mobileNo: owner.mobileNo,
        licenseNumber: owner.licenseNumber,
        gstNumber: owner.gstNumber,
      },
      accessToken,
      refreshToken,
    };
  }

  // ── Login ───────────────────────────────────────────────

  async login(data: LoginInput) {
    const owner = await authRepository.findOwnerByMobile(data.mobileNo);
    if (!owner) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    if (!owner.isActive) {
      throw ApiError.forbidden("Account is deactivated. Contact support.");
    }

    const isPasswordValid = await comparePassword(data.password, owner.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Generate tokens
    const tokenPayload = { userId: owner.id, role: "OWNER" as const };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await authRepository.updateRefreshToken(owner.id, refreshToken);

    logger.info(`Owner logged in: ${owner.id}`);

    return {
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        mobileNo: owner.mobileNo,
      },
      accessToken,
      refreshToken,
    };
  }

  // ── Refresh Token ───────────────────────────────────────

  async refreshToken(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      const owner = await authRepository.findOwnerById(decoded.userId);

      if (!owner) {
        throw ApiError.unauthorized("Invalid refresh token");
      }

      const tokenPayload = { userId: owner.id, role: "OWNER" as const };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await authRepository.updateRefreshToken(owner.id, refreshToken);

      return { accessToken, refreshToken };
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }
  }

  // ── Logout ──────────────────────────────────────────────

  async logout(userId: string) {
    await authRepository.updateRefreshToken(userId, null);
    logger.info(`Owner logged out: ${userId}`);
    return { message: "Logged out successfully" };
  }

  // ── Get Current User ────────────────────────────────────

  async getCurrentUser(userId: string) {
    const owner = await authRepository.findOwnerById(userId);
    if (!owner) {
      throw ApiError.notFound("User not found");
    }
    return owner;
  }
}

const authService = new AuthService();
export default authService;