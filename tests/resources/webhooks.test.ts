import { describe, expect, it } from "vitest";
import { WithalloClient } from "../../src/client.js";
import { WebhookTopic } from "../../src/enums.js";
import { mockFetch } from "../support/mock-fetch.js";

describe("WebhooksResource", () => {
  it("list() returns the data array from the envelope", async () => {
    const mocked = mockFetch([
      {
        status: 200,
        body: {
          data: [
            {
              allo_number: "+1",
              enabled: true,
              url: "https://x",
              topics: ["CALL_RECEIVED"],
            },
          ],
        },
      },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    const result = await client.webhooks.list();
    expect(result).toHaveLength(1);
    expect(mocked.last().method).toBe("GET");
    expect(mocked.last().url).toContain("/v1/api/webhooks");
  });

  it("create() converts enum topics to strings", async () => {
    const mocked = mockFetch([
      {
        status: 201,
        body: { data: { id: "web-1", enabled: true, url: "u", topics: [] } },
      },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.webhooks.create({
      alloNumber: "+1234567890",
      url: "https://example.com/hook",
      topics: [WebhookTopic.CALL_RECEIVED, WebhookTopic.SMS_RECEIVED],
    });

    expect(mocked.last().body).toEqual({
      allo_number: "+1234567890",
      url: "https://example.com/hook",
      enabled: true,
      topics: ["CALL_RECEIVED", "SMS_RECEIVED"],
    });
  });

  it("delete() URL-encodes the webhook id", async () => {
    const mocked = mockFetch([{ status: 204, body: undefined }]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.webhooks.delete("web abc/123");

    expect(mocked.last().method).toBe("DELETE");
    expect(mocked.last().url).toContain("/webhooks/web%20abc%2F123");
  });
});
