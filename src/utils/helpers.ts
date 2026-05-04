import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

// ── Password Hashing ──────────────────────────────────────────

export const hashPassword = async (password: string): Promise<string> => {
  return bcryptjs.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashed: string
): Promise<boolean> => {
  return bcryptjs.compare(password, hashed);
};

// ── JWT Token Generation ──────────────────────────────────────

interface TokenPayload {
  userId: string;
  role: string;
  ownerId?: string;
  shopId?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
  });
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

// ── OTP Generation ────────────────────────────────────────────

export const generateOtp = (length: number = env.OTP_LENGTH): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

export const getOtpExpiry = (): Date => {
  return new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
};

// ── Pagination Helper ─────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (
  page?: number | string,
  limit?: number | string
): PaginationParams => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
};

// ── GST Calculation ───────────────────────────────────────────

export interface GstBreakdown {
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * Calculates GST for pharmaceutical products.
 * Medicines typically fall under 5% or 12% GST.
 * @param amount - Taxable amount before GST
 * @param gstRate - Total GST rate (e.g., 5, 12, 18)
 * @param isInterState - If true, IGST applies; otherwise CGST+SGST
 */
export const calculateGst = (
  amount: number,
  gstRate: number,
  isInterState: boolean = false
): GstBreakdown => {
  const halfRate = gstRate / 2;

  if (isInterState) {
    const igstAmount = roundCurrency(amount * (gstRate / 100));
    return {
      taxableAmount: amount,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount,
      totalTax: igstAmount,
      totalAmount: roundCurrency(amount + igstAmount),
    };
  }

  const cgstAmount = roundCurrency(amount * (halfRate / 100));
  const sgstAmount = roundCurrency(amount * (halfRate / 100));

  return {
    taxableAmount: amount,
    cgstRate: halfRate,
    sgstRate: halfRate,
    igstRate: 0,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    totalTax: roundCurrency(cgstAmount + sgstAmount),
    totalAmount: roundCurrency(amount + cgstAmount + sgstAmount),
  };
};

export const roundCurrency = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};
