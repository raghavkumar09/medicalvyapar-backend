import prisma from "../../config/db.js";
import type { Prisma } from "@prisma/client";


export class AuthRepository {
  // ── Owner CRUD ──────────────────────────────────────────

  async createOwner(data: Prisma.OwnerCreateInput) {
    return prisma.owner.create({ data });
  }

  async findOwnerById(id: string) {
    return prisma.owner.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        isMobileNoVerified: true,
        isEmailVerified: true,
        isActive: true,
        gstNumber: true,
        licenseNumber: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOwnerByEmail(email: string) {
    return prisma.owner.findUnique({ where: { email } });
  }

  async findOwnerByMobile(mobileNo: string) {
    return prisma.owner.findUnique({ where: { mobileNo } });
  }

  async updateOwner(id: string, data: Prisma.OwnerUpdateInput) {
    return prisma.owner.update({ where: { id }, data });
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    return prisma.owner.update({
      where: { id },
      data: { refreshToken },
    });
  }

  // ── OTP CRUD ────────────────────────────────────────────

  async createOtp(data: Prisma.OtpCreateInput) {
    return prisma.otp.create({ data });
  }

  async findLatestOtp(target: string, type: string) {
    return prisma.otp.findFirst({
      where: {
        target,
        type: type as Prisma.EnumOtpTypeFilter["equals"],
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async markOtpUsed(id: string) {
    return prisma.otp.update({
      where: { id },
      data: { isUsed: true },
    });
  }

  async incrementOtpAttempts(id: string) {
    return prisma.otp.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async deleteExpiredOtps() {
    return prisma.otp.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

const authRepository = new AuthRepository();
export default authRepository;
