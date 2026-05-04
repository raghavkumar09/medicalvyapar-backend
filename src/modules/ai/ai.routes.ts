import { Router } from "express";
import aiController from "./ai.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

// Require auth for AI features
router.use(protect);

// Prescription OCR
router.post("/scan-prescription", upload.single("prescription"), aiController.scanPrescription);

// Supplier Invoice OCR
router.post("/scan-invoice", upload.single("invoice"), aiController.scanSupplierInvoice);

export default router;
