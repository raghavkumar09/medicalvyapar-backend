import medicineRepository from "./medicine.repository.js";
import shopRepository from "../shop/shop.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import type {
  CreateMedicineInput,
  CreateRackInput,
  AddStockInput,
  CreateSupplierInput,
} from "../../utils/validators.js";

export class MedicineService {
  // ── Medicine Catalog ────────────────────────────────────

  async createMedicine(data: CreateMedicineInput) {
    const medicine = await medicineRepository.create(data);
    logger.info(`Medicine created: ${medicine.id} - ${medicine.name}`);
    return medicine;
  }

  async getMedicineById(id: string) {
    const medicine = await medicineRepository.findById(id);
    if (!medicine) throw ApiError.notFound("Medicine not found");
    return medicine;
  }

  async searchMedicines(search?: string, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);
    const { medicines, total } = await medicineRepository.search(
      search || "",
      pagination.skip,
      pagination.limit
    );
    return { medicines, total, ...pagination };
  }

  async updateMedicine(id: string, data: Partial<CreateMedicineInput>) {
    const existing = await medicineRepository.findById(id);
    if (!existing) throw ApiError.notFound("Medicine not found");
    return medicineRepository.update(id, data);
  }

  // ── Rack Management ─────────────────────────────────────

  async createRack(shopId: string, ownerId: string, data: CreateRackInput) {
    await this.verifyShopOwnership(shopId, ownerId);

    // Create the rack
    const rack = await medicineRepository.createRack({
      name: data.name,
      rows: data.rows,
      columns: data.columns,
      location: data.location,
      shop: { connect: { id: shopId } },
    });

    // Auto-generate rack slots
    const slots = [];
    for (let row = 1; row <= data.rows; row++) {
      for (let col = 1; col <= data.columns; col++) {
        slots.push({
          label: `${data.name}-R${row}-C${col}`,
          row,
          column: col,
          rackId: rack.id,
        });
      }
    }

    await medicineRepository.createRackSlots(slots);
    logger.info(`Rack created: ${rack.id} with ${slots.length} slots for shop ${shopId}`);

    // Return rack with generated slots
    return medicineRepository.findRackById(rack.id);
  }

  async getShopRacks(shopId: string, ownerId: string) {
    await this.verifyShopOwnership(shopId, ownerId);
    return medicineRepository.findRacksByShopId(shopId);
  }

  // ── Stock Management ────────────────────────────────────

  async addStock(shopId: string, ownerId: string, data: AddStockInput) {
    await this.verifyShopOwnership(shopId, ownerId);

    // Verify medicine exists
    const medicine = await medicineRepository.findById(data.medicineId);
    if (!medicine) throw ApiError.notFound("Medicine not found in catalog");

    // Validate expiry date is in the future
    const expiryDate = new Date(data.expiryDate);
    if (expiryDate <= new Date()) {
      throw ApiError.badRequest("Expiry date must be in the future");
    }

    const stock = await medicineRepository.addStock({
      batchNumber: data.batchNumber,
      expiryDate,
      quantity: data.quantity,
      minStockLevel: data.minStockLevel,
      mrp: data.mrp,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      medicine: { connect: { id: data.medicineId } },
      shop: { connect: { id: shopId } },
      ...(data.rackSlotId ? { rackSlot: { connect: { id: data.rackSlotId } } } : {}),
      ...(data.supplierId ? { supplier: { connect: { id: data.supplierId } } } : {}),
    });

    // Record stock movement
    await medicineRepository.createStockMovement({
      type: "PURCHASE",
      quantity: data.quantity,
      previousQty: 0,
      newQty: data.quantity,
      reason: "Initial stock entry",
      medicineStock: { connect: { id: stock.id } },
    });

    logger.info(`Stock added: ${stock.id}, qty: ${data.quantity} for shop ${shopId}`);
    return stock;
  }

  async getShopStock(shopId: string, ownerId: string, search?: string, page?: number, limit?: number) {
    await this.verifyShopOwnership(shopId, ownerId);
    const pagination = parsePagination(page, limit);
    const { stocks, total } = await medicineRepository.findStockByShopId(
      shopId,
      pagination.skip,
      pagination.limit,
      search
    );
    return { stocks, total, ...pagination };
  }

  async getExpiringStock(shopId: string, ownerId: string, daysAhead: number = 90) {
    await this.verifyShopOwnership(shopId, ownerId);
    return medicineRepository.findExpiringStock(shopId, daysAhead);
  }

  async getLowStock(shopId: string, ownerId: string) {
    await this.verifyShopOwnership(shopId, ownerId);
    const allStock = await medicineRepository.findLowStock(shopId);
    // Filter in memory: quantity <= minStockLevel
    return allStock.filter((s) => s.quantity <= s.minStockLevel);
  }

  async updateStock(stockId: string, ownerId: string, data: { quantity?: number; minStockLevel?: number; sellingPrice?: number; rackSlotId?: string }) {
    const stock = await medicineRepository.findStockById(stockId);
    if (!stock) throw ApiError.notFound("Stock not found");
    await this.verifyShopOwnership(stock.shopId, ownerId);

    // Record movement if quantity changed
    if (data.quantity !== undefined && data.quantity !== stock.quantity) {
      await medicineRepository.createStockMovement({
        type: "ADJUSTMENT",
        quantity: Math.abs(data.quantity - stock.quantity),
        previousQty: stock.quantity,
        newQty: data.quantity,
        reason: "Manual adjustment",
        medicineStock: { connect: { id: stockId } },
      });
    }

    return medicineRepository.updateStock(stockId, data);
  }

  // ── Supplier ────────────────────────────────────────────

  async createSupplier(shopId: string, ownerId: string, data: CreateSupplierInput) {
    await this.verifyShopOwnership(shopId, ownerId);

    const supplier = await medicineRepository.createSupplier({
      ...data,
      shop: { connect: { id: shopId } },
    });

    logger.info(`Supplier created: ${supplier.id} for shop ${shopId}`);
    return supplier;
  }

  async getShopSuppliers(shopId: string, ownerId: string) {
    await this.verifyShopOwnership(shopId, ownerId);
    return medicineRepository.findSuppliersByShopId(shopId);
  }

  async updateSupplier(supplierId: string, ownerId: string, data: Partial<CreateSupplierInput>) {
    const supplier = await medicineRepository.findSupplierById(supplierId);
    if (!supplier) throw ApiError.notFound("Supplier not found");
    await this.verifyShopOwnership(supplier.shopId, ownerId);
    return medicineRepository.updateSupplier(supplierId, data);
  }

  // ── Helpers ─────────────────────────────────────────────

  private async verifyShopOwnership(shopId: string, ownerId: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) throw ApiError.notFound("Shop not found");
    if (shop.ownerId !== ownerId) throw ApiError.forbidden("Access denied");
    return shop;
  }
}

const medicineService = new MedicineService();
export default medicineService;
