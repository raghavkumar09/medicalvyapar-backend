import { Router } from "express";
import salesController from "./sales.controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  createInvoiceSchema,
  recordPaymentSchema,
} from "../../utils/validators.js";

const router = Router();

// All routes require authentication
router.use(protect);

// ── Customers ───────────────────────────────────────────
router.post(
  "/shops/:shopId/customers",
  validate(createCustomerSchema),
  salesController.createCustomer
);
router.get("/shops/:shopId/customers", salesController.getCustomers);
router.patch(
  "/customers/:customerId",
  validate(updateCustomerSchema),
  salesController.updateCustomer
);

// ── Invoices ────────────────────────────────────────────
router.post(
  "/shops/:shopId/invoices",
  authorize("OWNER", "ADMIN", "MANAGER", "SALESMAN"),
  validate(createInvoiceSchema),
  salesController.createInvoice
);
router.get("/shops/:shopId/invoices", salesController.getInvoices);
router.get("/invoices/:invoiceId", salesController.getInvoice);
router.post(
  "/invoices/:invoiceId/cancel",
  authorize("OWNER", "ADMIN"),
  salesController.cancelInvoice
);

// ── Payments ────────────────────────────────────────────
router.post(
  "/invoices/:invoiceId/payments",
  authorize("OWNER", "ADMIN", "MANAGER"),
  validate(recordPaymentSchema),
  salesController.recordPayment
);

// ── Reports ─────────────────────────────────────────────
router.get(
  "/shops/:shopId/reports/sales",
  authorize("OWNER", "ADMIN", "MANAGER"),
  salesController.getSalesReport
);

export default router;
