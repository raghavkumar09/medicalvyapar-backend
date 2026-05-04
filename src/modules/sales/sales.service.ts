import salesRepository from "./sales.repository.js";
import medicineRepository from "../medicine/medicine.repository.js";
import shopRepository from "../shop/shop.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { calculateGst, roundCurrency, parsePagination } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import type {
  CreateInvoiceInput,
  CreateCustomerInput,
  RecordPaymentInput,
} from "../../utils/validators.js";

export class SalesService {
  // ── Customer ────────────────────────────────────────────

  async createCustomer(shopId: string, ownerId: string, data: CreateCustomerInput) {
    await this.verifyShopAccess(shopId, ownerId);

    const existing = await salesRepository.findCustomerByPhoneAndShop(data.phone, shopId);
    if (existing) throw ApiError.conflict("Customer with this phone already exists");

    return salesRepository.createCustomer({
      ...data,
      shop: { connect: { id: shopId } },
    });
  }

  async getCustomers(shopId: string, ownerId: string, search?: string) {
    await this.verifyShopAccess(shopId, ownerId);
    return salesRepository.findCustomersByShopId(shopId, search);
  }

  async updateCustomer(customerId: string, ownerId: string, data: Partial<CreateCustomerInput>) {
    const customer = await salesRepository.findCustomerById(customerId);
    if (!customer) throw ApiError.notFound("Customer not found");
    await this.verifyShopAccess(customer.shopId, ownerId);
    return salesRepository.updateCustomer(customerId, data);
  }

  // ── Invoice Creation (Smart Billing) ────────────────────

  async createInvoice(shopId: string, userId: string, data: CreateInvoiceInput) {
    await this.verifyShopAccess(shopId, userId);

    // Handle customer: find existing or create new
    let customerId = data.customerId;
    if (!customerId && data.customerPhone) {
      let customer = await salesRepository.findCustomerByPhoneAndShop(data.customerPhone, shopId);
      if (!customer && data.customerName) {
        customer = await salesRepository.createCustomer({
          name: data.customerName,
          phone: data.customerPhone,
          shop: { connect: { id: shopId } },
        });
      }
      customerId = customer?.id;
    }

    // Generate invoice number: MV-SHOPID(4)-YYYYMMDD-SEQ
    const invoiceNumber = await this.generateInvoiceNumber(shopId);

    // Calculate line items
    let subtotal = 0;
    const itemsData: Array<{
      medicineStockId: string;
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      discountAmount: number;
      taxableAmount: number;
      gstRate: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalAmount: number;
    }> = [];

    for (const item of data.items) {
      const stock = await medicineRepository.findStockById(item.medicineStockId);
      if (!stock) throw ApiError.notFound(`Stock ${item.medicineStockId} not found`);
      if (stock.shopId !== shopId) throw ApiError.forbidden("Stock does not belong to this shop");
      if (stock.quantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for ${stock.medicine.name}. Available: ${stock.quantity}, Requested: ${item.quantity}`
        );
      }

      // Check expiry
      if (stock.expiryDate <= new Date()) {
        throw ApiError.badRequest(`${stock.medicine.name} (Batch: ${stock.batchNumber}) has expired`);
      }

      const unitPrice = stock.sellingPrice;
      const lineTotal = roundCurrency(unitPrice * item.quantity);
      const discountAmt = roundCurrency(lineTotal * (item.discountPercent / 100));
      const taxableAmt = roundCurrency(lineTotal - discountAmt);
      const gst = calculateGst(taxableAmt, stock.medicine.gstRate, data.isInterState);

      itemsData.push({
        medicineStockId: item.medicineStockId,
        quantity: item.quantity,
        unitPrice,
        discountPercent: item.discountPercent,
        discountAmount: discountAmt,
        taxableAmount: taxableAmt,
        gstRate: stock.medicine.gstRate,
        cgstAmount: gst.cgstAmount,
        sgstAmount: gst.sgstAmount,
        igstAmount: gst.igstAmount,
        totalAmount: gst.totalAmount,
      });

      subtotal += lineTotal;
    }

    // Calculate totals
    const invoiceDiscount = roundCurrency(subtotal * (data.discountPercent / 100));
    const taxableAmount = roundCurrency(subtotal - invoiceDiscount);
    const totalCgst = roundCurrency(itemsData.reduce((s, i) => s + i.cgstAmount, 0));
    const totalSgst = roundCurrency(itemsData.reduce((s, i) => s + i.sgstAmount, 0));
    const totalIgst = roundCurrency(itemsData.reduce((s, i) => s + i.igstAmount, 0));
    const totalTax = roundCurrency(totalCgst + totalSgst + totalIgst);
    const grandTotal = roundCurrency(taxableAmount + totalTax);
    const roundOff = roundCurrency(Math.round(grandTotal) - grandTotal);
    const finalAmount = Math.round(grandTotal);

    // Create invoice with items
    const invoice = await salesRepository.createInvoice({
      invoiceNumber,
      status: "CONFIRMED",
      subtotal,
      discountAmount: invoiceDiscount,
      discountPercent: data.discountPercent,
      taxableAmount,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      totalTax,
      grandTotal,
      roundOff,
      finalAmount,
      paymentMode: data.paymentMode,
      paymentStatus: data.paymentMode === "CREDIT" ? "PENDING" : "COMPLETED",
      paidAmount: data.paymentMode === "CREDIT" ? 0 : finalAmount,
      dueAmount: data.paymentMode === "CREDIT" ? finalAmount : 0,
      isInterState: data.isInterState,
      notes: data.notes,
      shop: { connect: { id: shopId } },
      ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
      items: {
        create: itemsData,
      },
    });

    // Deduct stock and record movements
    for (const item of itemsData) {
      const stock = await medicineRepository.findStockById(item.medicineStockId);
      if (stock) {
        await medicineRepository.decrementStock(item.medicineStockId, item.quantity);
        await medicineRepository.createStockMovement({
          type: "SALE",
          quantity: item.quantity,
          previousQty: stock.quantity,
          newQty: stock.quantity - item.quantity,
          reason: `Invoice: ${invoiceNumber}`,
          medicineStock: { connect: { id: item.medicineStockId } },
        });
      }
    }

    // Record payment if not credit
    if (data.paymentMode !== "CREDIT") {
      await salesRepository.createPayment({
        amount: finalAmount,
        mode: data.paymentMode,
        invoice: { connect: { id: invoice.id } },
      });
    }

    logger.info(`Invoice created: ${invoiceNumber} | Amount: ₹${finalAmount} | Shop: ${shopId}`);
    return invoice;
  }

  // ── Get Invoices ────────────────────────────────────────

  async getInvoices(
    shopId: string,
    ownerId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ) {
    await this.verifyShopAccess(shopId, ownerId);
    const pagination = parsePagination(options?.page, options?.limit);

    const { invoices, total } = await salesRepository.findInvoicesByShopId(
      shopId,
      pagination.skip,
      pagination.limit,
      {
        status: options?.status,
        startDate: options?.startDate ? new Date(options.startDate) : undefined,
        endDate: options?.endDate ? new Date(options.endDate) : undefined,
        search: options?.search,
      }
    );

    return { invoices, total, ...pagination };
  }

  async getInvoiceById(invoiceId: string, ownerId: string) {
    const invoice = await salesRepository.findInvoiceById(invoiceId);
    if (!invoice) throw ApiError.notFound("Invoice not found");
    await this.verifyShopAccess(invoice.shopId, ownerId);
    return invoice;
  }

  // ── Record Payment ──────────────────────────────────────

  async recordPayment(invoiceId: string, ownerId: string, data: RecordPaymentInput) {
    const invoice = await salesRepository.findInvoiceById(invoiceId);
    if (!invoice) throw ApiError.notFound("Invoice not found");
    await this.verifyShopAccess(invoice.shopId, ownerId);

    if (invoice.paymentStatus === "COMPLETED") {
      throw ApiError.badRequest("Invoice is already fully paid");
    }

    if (data.amount > invoice.dueAmount) {
      throw ApiError.badRequest(`Payment exceeds due amount. Due: ₹${invoice.dueAmount}`);
    }

    // Create payment record
    await salesRepository.createPayment({
      amount: data.amount,
      mode: data.mode,
      transactionRef: data.transactionRef,
      notes: data.notes,
      invoice: { connect: { id: invoiceId } },
    });

    // Update invoice payment status
    const newPaidAmount = roundCurrency(invoice.paidAmount + data.amount);
    const newDueAmount = roundCurrency(invoice.finalAmount - newPaidAmount);
    const newStatus = newDueAmount <= 0 ? "COMPLETED" : "PARTIAL";

    const updated = await salesRepository.updateInvoice(invoiceId, {
      paidAmount: newPaidAmount,
      dueAmount: Math.max(0, newDueAmount),
      paymentStatus: newStatus,
    });

    logger.info(`Payment recorded: ₹${data.amount} for invoice ${invoice.invoiceNumber}`);
    return updated;
  }

  // ── Cancel Invoice ──────────────────────────────────────

  async cancelInvoice(invoiceId: string, ownerId: string) {
    const invoice = await salesRepository.findInvoiceById(invoiceId);
    if (!invoice) throw ApiError.notFound("Invoice not found");
    await this.verifyShopAccess(invoice.shopId, ownerId);

    if (invoice.status === "CANCELLED") {
      throw ApiError.badRequest("Invoice is already cancelled");
    }

    // Restore stock
    for (const item of invoice.items) {
      await medicineRepository.incrementStock(item.medicineStockId, item.quantity);
      const stock = await medicineRepository.findStockById(item.medicineStockId);
      if (stock) {
        await medicineRepository.createStockMovement({
          type: "RETURN",
          quantity: item.quantity,
          previousQty: stock.quantity - item.quantity,
          newQty: stock.quantity,
          reason: `Invoice cancelled: ${invoice.invoiceNumber}`,
          medicineStock: { connect: { id: item.medicineStockId } },
        });
      }
    }

    return salesRepository.updateInvoice(invoiceId, {
      status: "CANCELLED",
      paymentStatus: "REFUNDED",
    });
  }

  // ── Sales Report ────────────────────────────────────────

  async getSalesReport(
    shopId: string,
    ownerId: string,
    startDate: string,
    endDate: string
  ) {
    await this.verifyShopAccess(shopId, ownerId);

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const report = await salesRepository.getSalesReport(shopId, start, end);
    const dailyReport = await salesRepository.getDailySales(shopId, new Date());

    return {
      period: { startDate, endDate },
      summary: {
        totalInvoices: report._count,
        totalSales: report._sum.finalAmount || 0,
        totalTax: report._sum.totalTax || 0,
        totalDiscount: report._sum.discountAmount || 0,
        totalPaid: report._sum.paidAmount || 0,
        totalDue: report._sum.dueAmount || 0,
      },
      today: {
        totalInvoices: dailyReport._count,
        totalSales: dailyReport._sum.finalAmount || 0,
      },
    };
  }

  // ── Helpers ─────────────────────────────────────────────

  private async generateInvoiceNumber(shopId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const shopPrefix = shopId.slice(-4).toUpperCase();

    const lastInvoice = await salesRepository.getLastInvoiceNumber(shopId);
    let sequence = 1;

    if (lastInvoice) {
      const parts = lastInvoice.split("-");
      const lastDate = parts[2];
      if (lastDate === dateStr) {
        sequence = parseInt(parts[3] || "0", 10) + 1;
      }
    }

    return `MV-${shopPrefix}-${dateStr}-${sequence.toString().padStart(4, "0")}`;
  }

  private async verifyShopAccess(shopId: string, userId: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) throw ApiError.notFound("Shop not found");
    if (shop.ownerId !== userId) throw ApiError.forbidden("Access denied");
    return shop;
  }
}

const salesService = new SalesService();
export default salesService;
