import { z } from "zod";

// ══════════════════════════════════════════════════════════
// AUTH VALIDATORS
// ══════════════════════════════════════════════════════════

export const sendOtpSchema = z.object({
  mobileNo: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  type: z.enum(["REGISTRATION", "LOGIN", "PASSWORD_RESET", "PHONE_VERIFY"]).default("LOGIN"),
});

export const verifyOtpSchema = z.object({
  mobileNo: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  mobileNo: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
  gstNumber: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, "Invalid GST number")
    .optional(),
  licenseNumber: z.string().min(3, "License number is required"),
});

export const loginSchema = z.object({
  mobileNo: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ══════════════════════════════════════════════════════════
// SHOP VALIDATORS
// ══════════════════════════════════════════════════════════

export const createShopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters").max(200),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  email: z.string().email().optional(),
  gstNumber: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/)
    .optional(),
  licenseNumber: z.string().optional(),
  billingType: z.enum(["RETAIL", "WHOLESALE", "BOTH"]).default("RETAIL"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const updateShopSchema = createShopSchema.partial();

// ══════════════════════════════════════════════════════════
// STAFF VALIDATORS
// ══════════════════════════════════════════════════════════

export const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  mobileNo: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "SALESMAN", "PACKER"]),
});

export const updateStaffSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MANAGER", "SALESMAN", "PACKER"]).optional(),
  isActive: z.boolean().optional(),
});

// ══════════════════════════════════════════════════════════
// MEDICINE VALIDATORS
// ══════════════════════════════════════════════════════════

export const createMedicineSchema = z.object({
  name: z.string().min(2, "Medicine name is required").max(300),
  genericName: z.string().optional(),
  saltComposition: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.number().min(0).max(28).default(12),
  prescriptionReq: z.boolean().default(false),
  description: z.string().optional(),
});

export const updateMedicineSchema = createMedicineSchema.partial();

// ══════════════════════════════════════════════════════════
// RACK VALIDATORS
// ══════════════════════════════════════════════════════════

export const createRackSchema = z.object({
  name: z.string().min(1, "Rack name is required").max(50),
  rows: z.number().int().min(1).max(20).default(5),
  columns: z.number().int().min(1).max(20).default(4),
  location: z.string().optional(),
});

// ══════════════════════════════════════════════════════════
// STOCK VALIDATORS
// ══════════════════════════════════════════════════════════

export const addStockSchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().datetime({ message: "Invalid expiry date" }),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  minStockLevel: z.number().int().min(0).default(10),
  mrp: z.number().positive("MRP must be positive"),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  rackSlotId: z.string().optional(),
  supplierId: z.string().optional(),
});

export const updateStockSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  sellingPrice: z.number().positive().optional(),
  rackSlotId: z.string().optional(),
});

// ══════════════════════════════════════════════════════════
// SUPPLIER VALIDATORS
// ══════════════════════════════════════════════════════════

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(200),
  contactName: z.string().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  email: z.string().email().optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ══════════════════════════════════════════════════════════
// CUSTOMER VALIDATORS
// ══════════════════════════════════════════════════════════

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ══════════════════════════════════════════════════════════
// INVOICE VALIDATORS
// ══════════════════════════════════════════════════════════

export const createInvoiceItemSchema = z.object({
  medicineStockId: z.string().min(1),
  quantity: z.number().int().min(1),
  discountPercent: z.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  items: z.array(createInvoiceItemSchema).min(1, "At least one item is required"),
  discountPercent: z.number().min(0).max(100).default(0),
  paymentMode: z.enum(["CASH", "UPI", "CARD", "NETBANKING", "CREDIT", "MIXED"]).default("CASH"),
  isInterState: z.boolean().default(false),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  mode: z.enum(["CASH", "UPI", "CARD", "NETBANKING", "CREDIT"]),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

// ══════════════════════════════════════════════════════════
// COMMON QUERY VALIDATORS
// ══════════════════════════════════════════════════════════

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;
export type CreateRackInput = z.infer<typeof createRackSchema>;
export type AddStockInput = z.infer<typeof addStockSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
