import prisma from "../../config/db.js";
import type { Prisma } from "@prisma/client";


export class ShopRepository {
  async create(data: Prisma.ShopCreateInput) {
    return prisma.shop.create({ data });
  }

  async findById(id: string) {
    return prisma.shop.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true, racks: true, medicineStock: true, invoices: true },
        },
      },
    });
  }

  async findByOwnerId(ownerId: string) {
    return prisma.shop.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: { staff: true, racks: true, medicineStock: true, invoices: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: Prisma.ShopUpdateInput) {
    return prisma.shop.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.shop.delete({ where: { id } });
  }

  // ── Staff ───────────────────────────────────────────────

  async createStaff(data: Prisma.StaffCreateInput) {
    return prisma.staff.create({ data });
  }

  async findStaffById(id: string) {
    return prisma.staff.findUnique({ where: { id } });
  }

  async findStaffByShopId(shopId: string) {
    return prisma.staff.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        mobileNo: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findStaffByMobileAndShop(mobileNo: string, shopId: string) {
    return prisma.staff.findUnique({
      where: { mobileNo_shopId: { mobileNo, shopId } },
    });
  }

  async updateStaff(id: string, data: Prisma.StaffUpdateInput) {
    return prisma.staff.update({ where: { id }, data });
  }

  async deleteStaff(id: string) {
    return prisma.staff.delete({ where: { id } });
  }
}

const shopRepository = new ShopRepository();
export default shopRepository;
