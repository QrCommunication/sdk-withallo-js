import { describe, expect, it, vi } from "vitest";
import { WebhookReceiver } from "../../src/webhook/receiver.js";
import { WebhookEvent } from "../../src/webhook/event.js";
import { WebhookTopic } from "../../src/enums.js";
import { InvalidWebhookPayloadError } from "../../src/errors.js";

describe("WebhookReceiver.parse", () => {
  it("builds a typed WebhookEvent", () => {
    const receiver = new WebhookReceiver();
    const event = receiver.parse(
      JSON.stringify({ topic: "CALL_RECEIVED", data: { id: "call_1" } }),
    );

    expect(event).toBeInstanceOf(WebhookEvent);
    expect(event.topic).toBe(WebhookTopic.CALL_RECEIVED);
    expect(event.isCall()).toBe(true);
    expect(event.isSms()).toBe(false);
    expect(event.get("id")).toBe("call_1");
  });

  it("rejects empty body", () => {
    expect(() => new WebhookReceiver().parse("")).toThrow(
      InvalidWebhookPayloadError,
    );
  });

  it("rejects non-JSON body", () => {
    expect(() => new WebhookReceiver().parse("not-json")).toThrow(
      InvalidWebhookPayloadError,
    );
  });

  it("rejects missing topic", () => {
    expect(() =>
      new WebhookReceiver().parse(JSON.stringify({ data: {} })),
    ).toThrow(InvalidWebhookPayloadError);
  });

  it("rejects missing data", () => {
    expect(() =>
      new WebhookReceiver().parse(JSON.stringify({ topic: "CALL_RECEIVED" })),
    ).toThrow(InvalidWebhookPayloadError);
  });

  it("rejects unknown topic", () => {
    expect(() =>
      new WebhookReceiver().parse(
        JSON.stringify({ topic: "WHATEVER", data: {} }),
      ),
    ).toThrow(InvalidWebhookPayloadError);
  });
});

describe("WebhookReceiver.dispatch", () => {
  it("invokes handlers in registration order, returns the count", async () => {
    const receiver = new WebhookReceiver();
    const calls: string[] = [];

    receiver
      .on(WebhookTopic.SMS_RECEIVED, (e) => {
        calls.push(`first:${String(e.get("id"))}`);
      })
      .on(WebhookTopic.SMS_RECEIVED, (e) => {
        calls.push(`second:${String(e.get("id"))}`);
      });

    const count = await receiver.dispatch(
      new WebhookEvent(WebhookTopic.SMS_RECEIVED, { id: "sms_1" }, {}),
    );

    expect(count).toBe(2);
    expect(calls).toEqual(["first:sms_1", "second:sms_1"]);
  });

  it("returns 0 when no handler is registered", async () => {
    const receiver = new WebhookReceiver();

    const count = await receiver.dispatch(
      new WebhookEvent(WebhookTopic.CONTACT_CREATED, {}, {}),
    );

    expect(count).toBe(0);
  });

  it("awaits async handlers", async () => {
    const receiver = new WebhookReceiver();
    const handler = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    receiver.on(WebhookTopic.CALL_RECEIVED, handler);

    await receiver.handle(
      JSON.stringify({ topic: "CALL_RECEIVED", data: { id: "c1" } }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("WebhookEvent.get", () => {
  it("supports dot-notation", () => {
    const event = new WebhookEvent(
      WebhookTopic.CALL_RECEIVED,
      { transfer_from: { user_name: "Alice" } },
      {},
    );

    expect(event.get("transfer_from.user_name")).toBe("Alice");
    expect(event.get("transfer_from.missing")).toBeNull();
    expect(event.get("missing.path", "default")).toBe("default");
  });
});
