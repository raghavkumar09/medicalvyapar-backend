import app from "./app.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";
import prisma from "./config/db.js";

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info("✅ Database connected successfully");

    app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(`🚀 MediVyapar API server running on port ${env.PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();