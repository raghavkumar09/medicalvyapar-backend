import { Router } from "express";
import shopController from "./shop.controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createShopSchema,
  updateShopSchema,
  createStaffSchema,
  updateStaffSchema,
} from "../../utils/validators.js";

const router = Router();

// All routes require authentication
router.use(protect);

// Shop routes (Owner only)
router.post("/", authorize("OWNER"), validate(createShopSchema), shopController.createShop);
router.get("/", shopController.getMyShops);
router.get("/:shopId", shopController.getShop);
router.patch("/:shopId", authorize("OWNER"), validate(updateShopSchema), shopController.updateShop);
router.delete("/:shopId", authorize("OWNER"), shopController.deleteShop);

// Staff routes (Owner only)
router.post("/:shopId/staff", authorize("OWNER"), validate(createStaffSchema), shopController.addStaff);
router.get("/:shopId/staff", authorize("OWNER", "ADMIN"), shopController.getStaff);
router.patch("/staff/:staffId", authorize("OWNER"), validate(updateStaffSchema), shopController.updateStaff);
router.delete("/staff/:staffId", authorize("OWNER"), shopController.deleteStaff);

export default router;
