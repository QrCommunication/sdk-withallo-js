import { WebhookTopic, WEBHOOK_TOPICS } from "../enums.js";
import { InvalidWebhookPayloadError } from "../errors.js";
import { WebhookEvent } from "./event.js";

export type WebhookHandler<TData = Record<string, unknown>> = (
  event: WebhookEvent<TData>,
) => void | Promise<void>;

/**
 * Parse incoming Withallo webhook payloads and dispatch them to registered handlers.
 *
 * IMPORTANT — signature verification
 * ----------------------------------
 * As of April 2026 the public Withallo documentation does NOT specify an HMAC
 * header for webhook authenticity verification. This receiver validates the
 * *shape* of the payload (topic + data) but cannot cryptographically verify
 * the origin.
 *
 * Recommended hardening:
 *   - serve your webhook endpoint on HTTPS only
 *   - use a secret, unguessable URL (token in the path)
 *   - whitelist Withallo egress IPs at the firewall
 *   - drop payloads whose `allo_number` does not match your own numbers
 *
 * Usage:
 *
 *   const receiver = new WebhookReceiver();
 *   receiver
 *     .on(WebhookTopic.CALL_RECEIVED, (e) => handleCall(e))
 *     .on(WebhookTopic.SMS_RECEIVED, (e) => handleSms(e));
 *
 *   await receiver.handle(rawBodyString);
 */
export class WebhookReceiver {
  private readonly handlers = new Map<WebhookTopic, WebhookHandler[]>();

  on<TData = Record<string, unknown>>(
    topic: WebhookTopic,
    handler: WebhookHandler<TData>,
  ): this {
    const existing = this.handlers.get(topic) ?? [];
    existing.push(handler as WebhookHandler);
    this.handlers.set(topic, existing);
    return this;
  }

  parse<TData = Record<string, unknown>>(rawBody: string): WebhookEvent<TData> {
    if (!rawBody || rawBody.trim() === "") {
      throw new InvalidWebhookPayloadError("Webhook body is empty.");
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(rawBody);
    } catch {
      throw new InvalidWebhookPayloadError("Webhook body is not valid JSON.");
    }

    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      throw new InvalidWebhookPayloadError(
        "Webhook body is not a JSON object.",
      );
    }

    const envelope = decoded as Record<string, unknown>;
    const topic = envelope.topic;
    const data = envelope.data;

    if (typeof topic !== "string" || topic === "") {
      throw new InvalidWebhookPayloadError(
        "Webhook payload is missing the `topic` field.",
      );
    }

    if (!data || typeof data !== "object") {
      throw new InvalidWebhookPayloadError(
        "Webhook payload is missing the `data` object.",
      );
    }

    if (!WEBHOOK_TOPICS.includes(topic as WebhookTopic)) {
      throw new InvalidWebhookPayloadError(`Unknown webhook topic: ${topic}`);
    }

    return new WebhookEvent<TData>(
      topic as WebhookTopic,
      data as TData,
      envelope,
    );
  }

  async dispatch<TData = Record<string, unknown>>(
    event: WebhookEvent<TData>,
  ): Promise<number> {
    const handlers = this.handlers.get(event.topic);
    if (!handlers || handlers.length === 0) return 0;

    for (const handler of handlers) {
      await handler(event as WebhookEvent);
    }

    return handlers.length;
  }

  /** Convenience: parse + dispatch in one call. */
  async handle<TData = Record<string, unknown>>(
    rawBody: string,
  ): Promise<WebhookEvent<TData>> {
    const event = this.parse<TData>(rawBody);
    await this.dispatch(event);
    return event;
  }
}
