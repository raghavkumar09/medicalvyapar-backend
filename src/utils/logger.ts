import winston from "winston";
import env from "../config/env.js";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp as string} [${level}]: ${(stack as string) || (message as string)}`;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: "medicalvyapar-api" },
  transports: [
    // Console output (always)
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // File outputs (production)
    ...(env.NODE_ENV === "production"
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error", maxsize: 5242880, maxFiles: 5 }),
          new winston.transports.File({ filename: "logs/combined.log", maxsize: 5242880, maxFiles: 5 }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

export default logger;
