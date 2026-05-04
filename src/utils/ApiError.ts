/**
 * Custom API Error class for consistent error handling across the application.
 * Extends the native Error class with HTTP status codes and structured error data.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: Record<string, string>[];

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: Record<string, string>[] = [],
    isOperational: boolean = true,
    stack?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // --- Factory methods for common HTTP errors ---

  static badRequest(message: string = "Bad request", errors: Record<string, string>[] = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message: string = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message: string = "Conflict") {
    return new ApiError(409, message);
  }

  static tooManyRequests(message: string = "Too many requests") {
    return new ApiError(429, message);
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(500, message, [], false);
  }
}
