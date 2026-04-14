import { describe, expect, it } from "vitest";
import { WithalloConfig } from "../src/config.js";

describe("WithalloConfig", () => {
  it("rejects empty API key", () => {
    expect(() => new WithalloConfig({ apiKey: "   " })).toThrow(/apiKey/);
  });

  it("defaults baseUrl to production", () => {
    const config = new WithalloConfig({ apiKey: "key" });
    expect(config.baseUrl).toBe("https://api.withallo.com/v1/api");
  });

  it("trims trailing slashes from baseUrl", () => {
    const config = new WithalloConfig({
      apiKey: "key",
      baseUrl: "https://example.com/api///",
    });
    expect(config.baseUrl).toBe("https://example.com/api");
  });

  it("exposes a default user agent", () => {
    const config = new WithalloConfig({ apiKey: "key" });
    expect(config.userAgent).toContain("withallo-sdk-js");
  });
});
