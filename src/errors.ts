/**
 * Base error for every Withallo SDK failure.
 */
export class WithalloError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WithalloError";
    if (
      typeof (Error as { captureStackTrace?: unknown }).captureStackTrace ===
      "function"
    ) {
      (
        Error as { captureStackTrace: (target: object, ctor: unknown) => void }
      ).captureStackTrace(this, this.constructor);
    }
  }
}

export interface WithalloErrorDetail {
  message?: string;
  field?: string;
  [key: string]: unknown;
}

export interface WithalloErrorBody {
  code?: string;
  details?: WithalloErrorDetail[] | null;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Thrown when the API returns an HTTP error (4xx/5xx) without a more specific subtype.
 */
export class ApiError extends WithalloError {
  public readonly httpStatus: number;
  public readonly responseBody: WithalloErrorBody | null;

  constructor(
    message: string,
    httpStatus: number,
    responseBody: WithalloErrorBody | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
    this.responseBody = responseBody;
  }

  getErrorCode(): string | null {
    return this.responseBody?.code ?? null;
  }

  getDetails(): WithalloErrorDetail[] {
    const details = this.responseBody?.details;
    return Array.isArray(details) ? details : [];
  }
}

/** 401 — API_KEY_INVALID */
export class AuthenticationError extends ApiError {
  constructor(
    message: string,
    httpStatus: number,
    body: WithalloErrorBody | null,
  ) {
    super(message, httpStatus, body);
    this.name = "AuthenticationError";
  }
}

/** 403 — API_KEY_INSUFFICIENT_SCOPE */
export class ForbiddenError extends ApiError {
  constructor(
    message: string,
    httpStatus: number,
    body: WithalloErrorBody | null,
  ) {
    super(message, httpStatus, body);
    this.name = "ForbiddenError";
  }

  /**
   * Extract scope names from `details[].message` ("required=SCOPE_NAME").
   */
  requiredScopes(): string[] {
    const scopes: string[] = [];
    for (const detail of this.getDetails()) {
      const message = detail.message;
      if (typeof message === "string" && message.startsWith("required=")) {
        scopes.push(message.slice("required=".length));
      }
    }
    return scopes;
  }
}

/** 400 / 422 — validation errors */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    httpStatus: number,
    body: WithalloErrorBody | null,
  ) {
    super(message, httpStatus, body);
    this.name = "ValidationError";
  }

  /**
   * Field-level errors keyed by field name.
   */
  errors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const detail of this.getDetails()) {
      if (
        typeof detail.field === "string" &&
        typeof detail.message === "string"
      ) {
        errors[detail.field] = detail.message;
      }
    }
    return errors;
  }
}

/** 404 — resource not found */
export class NotFoundError extends ApiError {
  constructor(
    message: string,
    httpStatus: number,
    body: WithalloErrorBody | null,
  ) {
    super(message, httpStatus, body);
    this.name = "NotFoundError";
  }
}

/** 429 — rate-limit exceeded */
export class RateLimitError extends ApiError {
  public retryAfterSeconds: number | null;

  constructor(
    message: string,
    httpStatus: number,
    body: WithalloErrorBody | null,
    retryAfterSeconds: number | null = null,
  ) {
    super(message, httpStatus, body);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Raised when a webhook payload cannot be parsed. */
export class InvalidWebhookPayloadError extends WithalloError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWebhookPayloadError";
  }
}
