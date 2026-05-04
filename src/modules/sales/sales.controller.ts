import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import salesService from "./sales.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

class SalesController {
  // ── Customers ───────────────────────────────────────────

  createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await salesService.createCustomer(req.params.shopId as string, req.user!.id, req.body);
    res.status(201).json(ApiResponse.created(customer));
  });

  getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const search = req.query.search as string | undefined;
    const customers = await salesService.getCustomers(req.params.shopId as string, req.user!.id, search);
    res.status(200).json(ApiResponse.ok(customers));
  });

  updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await salesService.updateCustomer(req.params.customerId as string, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(customer, "Customer updated"));
  });

  // ── Invoices ────────────────────────────────────────────

  createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await salesService.createInvoice(req.params.shopId as string, req.user!.id, req.body);
    res.status(201).json(ApiResponse.created(invoice, "Invoice created"));
  });

  getInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, status, startDate, endDate, search } = req.query as Record<string, string>;
    const result = await salesService.getInvoices(req.params.shopId as string, req.user!.id, {
      page: Number(page),
      limit: Number(limit),
      status,
      startDate,
      endDate,
      search,
    });
    res.status(200).json(
      ApiResponse.paginated(result.invoices, result.total, result.page, result.limit)
    );
  });

  getInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await salesService.getInvoiceById(req.params.invoiceId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(invoice));
  });

  cancelInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await salesService.cancelInvoice(req.params.invoiceId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(invoice, "Invoice cancelled"));
  });

  // ── Payments ────────────────────────────────────────────

  recordPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await salesService.recordPayment(req.params.invoiceId as string, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(invoice, "Payment recorded"));
  });

  // ── Reports ─────────────────────────────────────────────

  getSalesReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    if (!startDate || !endDate) {
      res.status(400).json(new ApiResponse(400, "startDate and endDate are required"));
      return;
    }
    const report = await salesService.getSalesReport(
      req.params.shopId as string,
      req.user!.id,
      startDate,
      endDate
    );
    res.status(200).json(ApiResponse.ok(report, "Sales report"));
  });
}

const salesController = new SalesController();
export default salesController;
