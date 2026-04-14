import { describe, expect, it } from "vitest";
import { WithalloClient } from "../../src/client.js";
import { mockFetch } from "../support/mock-fetch.js";

describe("SmsResource", () => {
  it("send() uses `from` field", async () => {
    const mocked = mockFetch([
      { status: 200, body: { data: { content: "hi" } } },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.sms.send({ from: "+1", to: "+2", message: "hi" });

    const body = mocked.last().body as Record<string, unknown>;
    expect(body.from).toBe("+1");
    expect(body.to).toBe("+2");
    expect(body.message).toBe("hi");
    expect(body.sender_id).toBeUndefined();
  });

  it("sendFrance() uses `sender_id` field, not `from`", async () => {
    const mocked = mockFetch([
      { status: 200, body: { data: { content: "bonjour" } } },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.sms.sendFrance({
      senderId: "MyCorp",
      to: "+33612345678",
      message: "bonjour",
    });

    const body = mocked.last().body as Record<string, unknown>;
    expect(body.sender_id).toBe("MyCorp");
    expect(body.from).toBeUndefined();
    expect(body.to).toBe("+33612345678");
  });
});
