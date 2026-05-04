import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import logger from "./utils/logger.js";

// Route imports
import authRoutes from "./modules/auth/auth.routes.js";
import shopRoutes from "./modules/shop/shop.routes.js";
import medicineRoutes from "./modules/medicine/medicine.routes.js";
import salesRoutes from "./modules/sales/sales.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";

const app = express();

// ── Security Middleware ───────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logging ───────────────────────────────────────────────
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );
}

// ── Rate Limiting ─────────────────────────────────────────
app.use("/api/", apiLimiter);

// ── Health Check ──────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MediVyapar API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: "1.0.0",
  });
});

// ── API Routes ────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/shops", shopRoutes);
app.use("/api/v1/medicines", medicineRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/ai", aiRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: "Route not found",
  });
});

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

export default app;