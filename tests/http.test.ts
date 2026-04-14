import { describe, expect, it } from "vitest";
import { WithalloConfig } from "../src/config.js";
import { HttpClient } from "../src/http.js";
import {
  ApiError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../src/errors.js";
import { mockFetch } from "./support/mock-fetch.js";

function buildClient(
  mocked: ReturnType<typeof mockFetch>,
  apiKey = "test-key",
): HttpClient {
  const config = new WithalloConfig({ apiKey, fetch: mocked.fetch });
  return new HttpClient(config);
}

describe("HttpClient", () => {
  it("sends Authorization header without Bearer prefix", async () => {
    const mocked = mockFetch([{ status: 200, body: { data: [] } }]);
    const http = buildClient(mocked, "my-secret-key");
    await http.get("/numbers");

    expect(mocked.last().headers["Authorization"]).toBe("my-secret-key");
  });

  it("appends query parameters to the URL", async () => {
    const mocked = mockFetch([{ status: 200, body: { data: {} } }]);
    const http = buildClient(mocked);
    await http.get("/calls", {
      query: { allo_number: "+1", page: 2, size: 50 },
    });

    const { url } = mocked.last();
    expect(url).toContain("allo_number=%2B1");
    expect(url).toContain("page=2");
    expect(url).toContain("size=50");
  });

  it("skips undefined / null query params", async () => {
    const mocked = mockFetch([{ status: 200, body: {} }]);
    const http = buildClient(mocked);
    await http.get("/x", { query: { a: "yes", b: undefined, c: null } });

    const { url } = mocked.last();
    expect(url).toContain("a=yes");
    expect(url).not.toContain("b=");
    expect(url).not.toContain("c=");
  });

  it("throws AuthenticationError on 401", async () => {
    const mocked = mockFetch([
      { status: 401, body: { code: "API_KEY_INVALID", details: null } },
    ]);
    const http = buildClient(mocked);

    await expect(http.get("/x")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("throws ForbiddenError on 403 and exposes required scopes", async () => {
    const mocked = mockFetch([
      {
        status: 403,
        body: {
          code: "API_KEY_INSUFFICIENT_SCOPE",
          details: [{ message: "required=CONTACTS_READ", field: "scope" }],
        },
      },
    ]);
    const http = buildClient(mocked);

    const error = await http.get("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).requiredScopes()).toEqual([
      "CONTACTS_READ",
    ]);
  });

  it("throws NotFoundError on 404", async () => {
    const mocked = mockFetch([
      { status: 404, body: { error: "WEBHOOK_NOT_FOUND" } },
    ]);
    const http = buildClient(mocked);

    await expect(http.delete("/webhooks/web-x")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws ValidationError on 422 and exposes field errors", async () => {
    const mocked = mockFetch([
      {
        status: 422,
        body: {
          code: "VALIDATION_ERROR",
          details: [{ field: "numbers", message: "must not be empty" }],
        },
      },
    ]);
    const http = buildClient(mocked);

    const error = await http.post("/contacts", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).errors()).toEqual({
      numbers: "must not be empty",
    });
  });

  it("throws RateLimitError on 429 with Retry-After", async () => {
    const mocked = mockFetch([
      {
        status: 429,
        body: { code: "RATE_LIMITED" },
        headers: { "Content-Type": "application/json", "Retry-After": "12" },
      },
    ]);
    const http = buildClient(mocked);

    const error = await http.get("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfterSeconds).toBe(12);
  });

  it("throws generic ApiError for unknown 5xx", async () => {
    const mocked = mockFetch([
      { status: 503, body: { message: "maintenance" } },
    ]);
    const http = buildClient(mocked);

    const error = await http.get("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(503);
  });
});
