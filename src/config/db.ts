import { PrismaClient } from "@prisma/client";
import env from "./env.js";
import logger from "../utils/logger.js";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  logger.info("Database disconnected");
});

export default prisma;