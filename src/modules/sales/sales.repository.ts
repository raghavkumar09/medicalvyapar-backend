import prisma from "../../config/db.js";
import type { Prisma } from "@prisma/client";


export class SalesRepository {
  // ── Customer ────────────────────────────────────────────

  async createCustomer(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  }

  async findCustomerById(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  }

  async findCustomerByPhoneAndShop(phone: string, shopId: string) {
    return prisma.customer.findUnique({
      where: { phone_shopId: { phone, shopId } },
    });
  }

  async findCustomersByShopId(shopId: string, search?: string) {
    const where: Prisma.CustomerWhereInput = {
      shopId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };
    return prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  }

  // ── Invoice ─────────────────────────────────────────────

  async createInvoice(data: Prisma.InvoiceCreateInput) {
    return prisma.invoice.create({
      data,
      include: {
        items: { include: { medicineStock: { include: { medicine: true } } } },
        customer: true,
        payments: true,
      },
    });
  }

  async findInvoiceById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { medicineStock: { include: { medicine: true } } } },
        customer: true,
        staff: { select: { id: true, name: true, role: true } },
        payments: true,
      },
    });
  }

  async findInvoiceByNumber(invoiceNumber: string) {
    return prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: { include: { medicineStock: { include: { medicine: true } } } },
        customer: true,
        payments: true,
      },
    });
  }

  async findInvoicesByShopId(
    shopId: string,
    skip: number,
    take: number,
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ) {
    const where: Prisma.InvoiceWhereInput = {
      shopId,
      ...(filters?.status ? { status: filters.status as Prisma.EnumInvoiceStatusFilter["equals"] } : {}),
      ...(filters?.startDate || filters?.endDate
        ? {
            createdAt: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
              { customer: { name: { contains: filters.search, mode: "insensitive" } } },
              { customer: { phone: { contains: filters.search } } },
            ],
          }
        : {}),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        include: {
          customer: true,
          staff: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  async updateInvoice(id: string, data: Prisma.InvoiceUpdateInput) {
    return prisma.invoice.update({
      where: { id },
      data,
      include: {
        items: { include: { medicineStock: { include: { medicine: true } } } },
        customer: true,
        payments: true,
      },
    });
  }

  // ── Invoice Items ───────────────────────────────────────

  async createInvoiceItem(data: Prisma.InvoiceItemCreateInput) {
    return prisma.invoiceItem.create({ data });
  }

  // ── Payments ────────────────────────────────────────────

  async createPayment(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({ data });
  }

  async getPaymentsByInvoiceId(invoiceId: string) {
    return prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Sales Reports ───────────────────────────────────────

  async getSalesReport(shopId: string, startDate: Date, endDate: Date) {
    const result = await prisma.invoice.aggregate({
      where: {
        shopId,
        status: { in: ["CONFIRMED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        finalAmount: true,
        totalTax: true,
        discountAmount: true,
        paidAmount: true,
        dueAmount: true,
      },
      _count: true,
    });
    return result;
  }

  async getDailySales(shopId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getSalesReport(shopId, startOfDay, endOfDay);
  }

  // ── Invoice Number Generation ───────────────────────────

  async getLastInvoiceNumber(shopId: string) {
    const lastInvoice = await prisma.invoice.findFirst({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });
    return lastInvoice?.invoiceNumber;
  }
}

const salesRepository = new SalesRepository();
export default salesRepository;
