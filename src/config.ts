import { Environment } from "./enums.js";

export interface WithalloConfigOptions {
  apiKey: string;
  environment?: Environment;
  baseUrl?: string;
  timeoutMs?: number;
  userAgent?: string;
  fetch?: typeof fetch;
}

/**
 * Immutable runtime configuration. `apiKey` is sent verbatim in the
 * `Authorization` header (no `Bearer` prefix).
 */
export class WithalloConfig {
  readonly apiKey: string;
  readonly environment: Environment;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly userAgent: string;
  readonly fetch: typeof fetch;

  constructor(options: WithalloConfigOptions) {
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new Error("WithalloConfig: apiKey cannot be empty.");
    }
    this.apiKey = options.apiKey;
    this.environment = options.environment ?? Environment.PRODUCTION;
    this.baseUrl = (
      options.baseUrl ?? "https://api.withallo.com/v1/api"
    ).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.userAgent = options.userAgent ?? "qrcommunication/withallo-sdk-js";
    this.fetch = options.fetch ?? globalThis.fetch;

    if (typeof this.fetch !== "function") {
      throw new Error(
        "WithalloConfig: no fetch implementation available. Provide one via `fetch` option or run on a platform with a global fetch (Node 18+, browsers, Deno).",
      );
    }
  }
}
