/**
 * Standardized API response wrapper.
 * Every API response follows this consistent shape.
 */
export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T | null;
  public readonly meta?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string = "Success",
    data: T | null = null,
    meta?: Record<string, unknown>
  ) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  // --- Factory methods ---

  static ok<T>(data: T, message: string = "Success", meta?: Record<string, unknown>) {
    return new ApiResponse(200, message, data, meta);
  }

  static created<T>(data: T, message: string = "Created successfully") {
    return new ApiResponse(201, message, data);
  }

  static noContent(message: string = "Deleted successfully") {
    return new ApiResponse(204, message, null);
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = "Success"
  ) {
    return new ApiResponse(200, message, data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    });
  }
}
