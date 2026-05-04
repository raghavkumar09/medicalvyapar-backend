import { Router } from "express";
import medicineController from "./medicine.controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createMedicineSchema,
  updateMedicineSchema,
  createRackSchema,
  addStockSchema,
  updateStockSchema,
  createSupplierSchema,
  updateSupplierSchema,
} from "../../utils/validators.js";

const router = Router();

// All routes require authentication
router.use(protect);

// ── Medicine Catalog (shared across all shops) ──────────
router.post("/", authorize("OWNER", "ADMIN"), validate(createMedicineSchema), medicineController.createMedicine);
router.get("/", medicineController.searchMedicines);
router.get("/:id", medicineController.getMedicine);
router.patch("/:id", authorize("OWNER", "ADMIN"), validate(updateMedicineSchema), medicineController.updateMedicine);

// ── Racks (shop-specific) ───────────────────────────────
router.post("/shops/:shopId/racks", authorize("OWNER", "ADMIN"), validate(createRackSchema), medicineController.createRack);
router.get("/shops/:shopId/racks", medicineController.getShopRacks);

// ── Stock (shop-specific) ───────────────────────────────
router.post("/shops/:shopId/stock", authorize("OWNER", "ADMIN", "MANAGER"), validate(addStockSchema), medicineController.addStock);
router.get("/shops/:shopId/stock", medicineController.getShopStock);
router.get("/shops/:shopId/stock/expiring", medicineController.getExpiringStock);
router.get("/shops/:shopId/stock/low", medicineController.getLowStock);
router.patch("/stock/:stockId", authorize("OWNER", "ADMIN", "MANAGER"), validate(updateStockSchema), medicineController.updateStock);

// ── Suppliers (shop-specific) ───────────────────────────
router.post("/shops/:shopId/suppliers", authorize("OWNER", "ADMIN"), validate(createSupplierSchema), medicineController.createSupplier);
router.get("/shops/:shopId/suppliers", medicineController.getSuppliers);
router.patch("/suppliers/:supplierId", authorize("OWNER", "ADMIN"), validate(updateSupplierSchema), medicineController.updateSupplier);

export default router;
