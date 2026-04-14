import type { WebhookTopic } from "../enums.js";

/**
 * Immutable representation of a parsed webhook payload.
 *
 * Envelope: `{ "topic": "CALL_RECEIVED", "data": { ... } }`.
 */
export class WebhookEvent<TData = Record<string, unknown>> {
  constructor(
    public readonly topic: WebhookTopic,
    public readonly data: TData,
    public readonly raw: Record<string, unknown>,
  ) {}

  isCall(): boolean {
    return this.topic === "CALL_RECEIVED";
  }

  isSms(): boolean {
    return this.topic === "SMS_RECEIVED";
  }

  isContactCreated(): boolean {
    return this.topic === "CONTACT_CREATED";
  }

  isContactUpdated(): boolean {
    return this.topic === "CONTACT_UPDATED";
  }

  /**
   * Read a field from `data` using dot-notation. Returns `fallback` if the path does not resolve.
   */
  get<T = unknown>(path: string, fallback: T | null = null): T | null {
    const segments = path.split(".");
    let current: unknown = this.data;

    for (const segment of segments) {
      if (typeof current !== "object" || current === null) {
        return fallback;
      }
      const record = current as Record<string, unknown>;
      if (!(segment in record)) {
        return fallback;
      }
      current = record[segment];
    }

    return (current as T) ?? fallback;
  }
}
