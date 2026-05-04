import prisma from "../../config/db.js";
import type { Prisma } from "@prisma/client";


export class MedicineRepository {
  // ── Medicine Catalog ────────────────────────────────────

  async create(data: Prisma.MedicineCreateInput) {
    return prisma.medicine.create({ data });
  }

  async findById(id: string) {
    return prisma.medicine.findUnique({
      where: { id },
      include: { _count: { select: { stocks: true } } },
    });
  }

  async search(query: string, skip: number, take: number) {
    const where: Prisma.MedicineWhereInput = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { genericName: { contains: query, mode: "insensitive" } },
            { saltComposition: { contains: query, mode: "insensitive" } },
            { manufacturer: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, total };
  }

  async update(id: string, data: Prisma.MedicineUpdateInput) {
    return prisma.medicine.update({ where: { id }, data });
  }

  // ── Rack Management ─────────────────────────────────────

  async createRack(data: Prisma.RackCreateInput) {
    return prisma.rack.create({
      data,
      include: { slots: true },
    });
  }

  async createRackSlots(slots: Prisma.RackSlotCreateManyInput[]) {
    return prisma.rackSlot.createMany({ data: slots });
  }

  async findRacksByShopId(shopId: string) {
    return prisma.rack.findMany({
      where: { shopId },
      include: {
        slots: {
          include: {
            _count: { select: { stocks: true } },
          },
          orderBy: [{ row: "asc" }, { column: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findRackById(id: string) {
    return prisma.rack.findUnique({
      where: { id },
      include: { slots: true },
    });
  }

  // ── Stock Management ────────────────────────────────────

  async addStock(data: Prisma.MedicineStockCreateInput) {
    return prisma.medicineStock.create({
      data,
      include: { medicine: true, rackSlot: true },
    });
  }

  async findStockById(id: string) {
    return prisma.medicineStock.findUnique({
      where: { id },
      include: { medicine: true, rackSlot: { include: { rack: true } }, supplier: true },
    });
  }

  async findStockByShopId(
    shopId: string,
    skip: number,
    take: number,
    search?: string
  ) {
    const where: Prisma.MedicineStockWhereInput = {
      shopId,
      ...(search
        ? {
            medicine: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { genericName: { contains: search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    };

    const [stocks, total] = await Promise.all([
      prisma.medicineStock.findMany({
        where,
        skip,
        take,
        include: {
          medicine: true,
          rackSlot: { include: { rack: true } },
          supplier: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.medicineStock.count({ where }),
    ]);

    return { stocks, total };
  }

  async findExpiringStock(shopId: string, daysAhead: number = 90) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.medicineStock.findMany({
      where: {
        shopId,
        expiryDate: { lte: futureDate },
        quantity: { gt: 0 },
      },
      include: {
        medicine: true,
        rackSlot: { include: { rack: true } },
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  async findLowStock(shopId: string) {
    return prisma.medicineStock.findMany({
      where: {
        shopId,
        // Raw comparison: quantity <= minStockLevel
        // Since Prisma doesn't support field comparison directly,
        // we fetch all and filter in service (or use $queryRaw)
      },
      include: {
        medicine: true,
        rackSlot: { include: { rack: true } },
      },
      orderBy: { quantity: "asc" },
    });
  }

  async updateStock(id: string, data: Prisma.MedicineStockUpdateInput) {
    return prisma.medicineStock.update({
      where: { id },
      data,
      include: { medicine: true },
    });
  }

  async decrementStock(id: string, quantity: number) {
    return prisma.medicineStock.update({
      where: { id },
      data: { quantity: { decrement: quantity } },
    });
  }

  async incrementStock(id: string, quantity: number) {
    return prisma.medicineStock.update({
      where: { id },
      data: { quantity: { increment: quantity } },
    });
  }

  // ── Stock Movement ──────────────────────────────────────

  async createStockMovement(data: Prisma.StockMovementCreateInput) {
    return prisma.stockMovement.create({ data });
  }

  // ── Supplier ────────────────────────────────────────────

  async createSupplier(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data });
  }

  async findSuppliersByShopId(shopId: string) {
    return prisma.supplier.findMany({
      where: { shopId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async findSupplierById(id: string) {
    return prisma.supplier.findUnique({ where: { id } });
  }

  async updateSupplier(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({ where: { id }, data });
  }
}

const medicineRepository = new MedicineRepository();
export default medicineRepository;
