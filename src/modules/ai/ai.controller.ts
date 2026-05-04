import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";

class AiController {
  scanPrescription = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest("Prescription image/PDF is required");
    }

    // TODO: Integrate with AI OCR Service (e.g., Gemini Vision, Google Cloud Vision)
    // For now, return placeholder data simulating OCR result
    const mockOcrResult = {
      medicines: [
        { name: "Paracetamol 500mg", quantity: 10, dosage: "1-0-1" },
        { name: "Amoxicillin", quantity: 5, dosage: "1-1-1" }
      ],
      doctorName: "Dr. Sharma",
      date: new Date().toISOString()
    };

    res.status(200).json(ApiResponse.ok(mockOcrResult, "Prescription scanned successfully (Demo Mode)"));
  });

  scanSupplierInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest("Supplier invoice image/PDF is required");
    }

    // TODO: Integrate with AI Document AI
    const mockInvoiceResult = {
      supplierName: "Apex Pharma",
      gstNumber: "27AAAAA0000A1Z5",
      invoiceNumber: "INV-9988",
      items: [
        { name: "Dolo 650", batch: "B123", expiry: "2026-12-01", qty: 100, mrp: 30, purchasePrice: 22 }
      ],
      totalAmount: 2200
    };

    res.status(200).json(ApiResponse.ok(mockInvoiceResult, "Invoice data extracted (Demo Mode)"));
  });
}

const aiController = new AiController();
export default aiController;
