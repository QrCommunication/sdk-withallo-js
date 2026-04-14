/**
 * Exhaustive error-handling example.
 *
 * Demonstrates:
 *   - graceful rate-limit handling with Retry-After
 *   - scope-aware UX for 403
 *   - field-level form errors from 400/422
 *   - fail-fast vs. degrade-gracefully patterns
 */

import {
  WithalloClient,
  WebhookTopic,
  ApiError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "@qrcommunication/withallo-sdk";

const client = new WithalloClient({ apiKey: process.env.WITHALLO_API_KEY! });

async function createWebhookWithRetry(alloNumber: string, url: string) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await client.webhooks.create({
        alloNumber,
        url,
        topics: [WebhookTopic.CALL_RECEIVED],
      });
    } catch (err) {
      if (err instanceof RateLimitError) {
        const wait = (err.retryAfterSeconds ?? 1) * 1000;
        console.warn(
          `rate-limited, retrying in ${wait}ms (attempt ${attempt}/${maxAttempts})`,
        );
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error("rate-limit retries exhausted");
}

async function ensureWebhook(alloNumber: string, url: string) {
  try {
    await createWebhookWithRetry(alloNumber, url);
  } catch (err) {
    if (err instanceof AuthenticationError) {
      console.error("API key is invalid or revoked — ask an admin.");
      process.exit(1);
    }
    if (err instanceof ForbiddenError) {
      console.error(
        "Missing scopes:",
        err.requiredScopes().join(", "),
        "\nGo to https://web.withallo.com/settings/api and re-scope the key.",
      );
      process.exit(1);
    }
    if (err instanceof ValidationError) {
      console.error("Payload rejected:", err.errors());
      // e.g. { url: "must be https", topics: "at least one required" }
      return;
    }
    if (err instanceof NotFoundError) {
      console.error("Resource not found — did Withallo remove the number?");
      return;
    }
    if (err instanceof ApiError) {
      console.error(
        `Unhandled API error (HTTP ${err.httpStatus}):`,
        err.getErrorCode(),
        err.getDetails(),
      );
      throw err;
    }
    throw err; // anything non-ApiError bubbles up
  }
}

// ---- Usage ----
await ensureWebhook("+33188833451", "https://example.com/webhooks/allo");
