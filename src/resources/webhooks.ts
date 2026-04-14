import type { HttpClient } from "../http.js";
import type { WebhookTopic } from "../enums.js";
import type { CreateWebhookInput, Webhook } from "../types/webhook.js";
import type { EnvelopedResponse } from "../types/common.js";

/**
 * Webhooks resource — manage webhook subscriptions.
 *
 * Required scope: `WEBHOOKS_READ_WRITE`.
 */
export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /** List all webhook configurations. */
  async list(): Promise<Webhook[]> {
    const response =
      await this.http.get<EnvelopedResponse<Webhook[]>>("/webhooks");
    return Array.isArray(response?.data) ? response.data : [];
  }

  /** Create a new webhook configuration. */
  async create(input: CreateWebhookInput): Promise<Webhook> {
    const response = await this.http.post<EnvelopedResponse<Webhook>>(
      "/webhooks",
      {
        allo_number: input.alloNumber,
        url: input.url,
        enabled: input.enabled ?? true,
        topics: input.topics.map(String) as (WebhookTopic | string)[],
      },
    );
    return response.data;
  }

  /** Delete a webhook by its ID (e.g. `web-abc123`). */
  async delete(webhookId: string): Promise<void> {
    await this.http.delete(`/webhooks/${encodeURIComponent(webhookId)}`);
  }
}
