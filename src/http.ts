import type { WithalloConfig } from "./config.js";
import {
  ApiError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  type WithalloErrorBody,
} from "./errors.js";

export interface HttpRequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Low-level HTTP client wrapping the native `fetch` API.
 *
 * Isomorphic: works in Node 18+, browsers, Deno, React Native, and edge runtimes.
 */
export class HttpClient {
  constructor(private readonly config: WithalloConfig) {}

  get<T = unknown>(
    path: string,
    options: Omit<HttpRequestOptions, "body"> = {},
  ): Promise<T> {
    return this.request<T>("GET", path, options);
  }

  post<T = unknown>(
    path: string,
    body: unknown = {},
    options: Omit<HttpRequestOptions, "body"> = {},
  ): Promise<T> {
    return this.request<T>("POST", path, { ...options, body });
  }

  put<T = unknown>(
    path: string,
    body: unknown = {},
    options: Omit<HttpRequestOptions, "body"> = {},
  ): Promise<T> {
    return this.request<T>("PUT", path, { ...options, body });
  }

  delete<T = unknown>(
    path: string,
    options: Omit<HttpRequestOptions, "body"> = {},
  ): Promise<T> {
    return this.request<T>("DELETE", path, options);
  }

  private async request<T>(
    method: string,
    path: string,
    options: HttpRequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(
      () => timeoutController.abort(),
      this.config.timeoutMs,
    );
    const signal = this.mergeSignals(options.signal, timeoutController.signal);

    let response: Response;
    try {
      response = await this.config.fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: this.config.apiKey,
          "User-Agent": this.config.userAgent,
        },
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const reason = err instanceof Error ? err.message : String(err);
      throw new ApiError(`HTTP request failed: ${reason}`, 0, null);
    } finally {
      clearTimeout(timeoutId);
    }

    const rawBody = await response.text();
    const decoded = this.decodeBody(rawBody);

    if (!response.ok) {
      throw this.buildException(
        response.status,
        decoded,
        response.headers.get("Retry-After"),
      );
    }

    return decoded as T;
  }

  private buildUrl(path: string, query: HttpRequestOptions["query"]): string {
    const joined = `${this.config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    if (!query) return joined;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${joined}?${qs}` : joined;
  }

  private decodeBody(rawBody: string): unknown {
    if (rawBody === "") return {};
    try {
      return JSON.parse(rawBody);
    } catch {
      return { raw: rawBody };
    }
  }

  private buildException(
    statusCode: number,
    body: unknown,
    retryAfterHeader: string | null,
  ): ApiError {
    const errorBody = this.normalizeErrorBody(body);
    const message = this.extractMessage(errorBody, statusCode);

    switch (statusCode) {
      case 401:
        return new AuthenticationError(message, statusCode, errorBody);
      case 403:
        return new ForbiddenError(message, statusCode, errorBody);
      case 404:
        return new NotFoundError(message, statusCode, errorBody);
      case 400:
      case 422:
        return new ValidationError(message, statusCode, errorBody);
      case 429: {
        const retryAfter = this.parseRetryAfter(retryAfterHeader);
        return new RateLimitError(message, statusCode, errorBody, retryAfter);
      }
      default:
        return new ApiError(message, statusCode, errorBody);
    }
  }

  private normalizeErrorBody(body: unknown): WithalloErrorBody | null {
    if (!body || typeof body !== "object") return null;
    return body as WithalloErrorBody;
  }

  private extractMessage(
    body: WithalloErrorBody | null,
    statusCode: number,
  ): string {
    if (!body) return `HTTP ${statusCode}`;

    if (typeof body.code === "string") return body.code;

    for (const key of ["message", "error", "detail"] as const) {
      const value = body[key];
      if (typeof value === "string") return value;
    }

    return `HTTP ${statusCode}`;
  }

  private parseRetryAfter(header: string | null): number | null {
    if (!header) return null;
    const parsed = Number(header);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  private mergeSignals(
    external: AbortSignal | undefined,
    internal: AbortSignal,
  ): AbortSignal {
    if (!external) return internal;
    // Prefer AbortSignal.any if available (Node 20+, modern browsers).
    const anyFn = (
      AbortSignal as { any?: (signals: AbortSignal[]) => AbortSignal }
    ).any;
    if (typeof anyFn === "function") {
      return anyFn([external, internal]);
    }
    // Fallback: propagate external abort to internal controller.
    if (external.aborted) {
      const controller = new AbortController();
      controller.abort(external.reason);
      return controller.signal;
    }
    const controller = new AbortController();
    external.addEventListener(
      "abort",
      () => controller.abort(external.reason),
      { once: true },
    );
    internal.addEventListener(
      "abort",
      () => controller.abort(internal.reason),
      { once: true },
    );
    return controller.signal;
  }
}
