import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import medicineService from "./medicine.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

class MedicineController {
  // ── Medicine Catalog ────────────────────────────────────

  createMedicine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const medicine = await medicineService.createMedicine(req.body);
    res.status(201).json(ApiResponse.created(medicine));
  });

  getMedicine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const medicine = await medicineService.getMedicineById(req.params.id as string);
    res.status(200).json(ApiResponse.ok(medicine));
  });

  searchMedicines = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, page, limit } = req.query as { search?: string; page?: string; limit?: string };
    const result = await medicineService.searchMedicines(search, Number(page), Number(limit));
    res.status(200).json(
      ApiResponse.paginated(result.medicines, result.total, result.page, result.limit)
    );
  });

  updateMedicine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const medicine = await medicineService.updateMedicine(req.params.id as string, req.body);
    res.status(200).json(ApiResponse.ok(medicine, "Medicine updated"));
  });

  // ── Racks ───────────────────────────────────────────────

  createRack = asyncHandler(async (req: AuthRequest, res: Response) => {
    const rack = await medicineService.createRack(req.params.shopId as string, req.user!.id, req.body);
    res.status(201).json(ApiResponse.created(rack, "Rack created with slots"));
  });

  getShopRacks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const racks = await medicineService.getShopRacks(req.params.shopId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(racks));
  });

  // ── Stock ───────────────────────────────────────────────

  addStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stock = await medicineService.addStock(req.params.shopId as string, req.user!.id, req.body);
    res.status(201).json(ApiResponse.created(stock, "Stock added"));
  });

  getShopStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, page, limit } = req.query as { search?: string; page?: string; limit?: string };
    const result = await medicineService.getShopStock(
      req.params.shopId as string, req.user!.id, search, Number(page), Number(limit)
    );
    res.status(200).json(
      ApiResponse.paginated(result.stocks, result.total, result.page, result.limit)
    );
  });

  getExpiringStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const days = Number(req.query.days) || 90;
    const stock = await medicineService.getExpiringStock(req.params.shopId as string, req.user!.id, days);
    res.status(200).json(ApiResponse.ok(stock, `Stock expiring within ${days} days`));
  });

  getLowStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stock = await medicineService.getLowStock(req.params.shopId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(stock, "Low stock items"));
  });

  updateStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stock = await medicineService.updateStock(req.params.stockId as string, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(stock, "Stock updated"));
  });

  // ── Suppliers ───────────────────────────────────────────

  createSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
    const supplier = await medicineService.createSupplier(req.params.shopId as string, req.user!.id, req.body);
    res.status(201).json(ApiResponse.created(supplier));
  });

  getSuppliers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const suppliers = await medicineService.getShopSuppliers(req.params.shopId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(suppliers));
  });

  updateSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
    const supplier = await medicineService.updateSupplier(req.params.supplierId as string, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(supplier, "Supplier updated"));
  });
}

const medicineController = new MedicineController();
export default medicineController;
