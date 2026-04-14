import { describe, expect, it } from "vitest";
import { WithalloClient } from "../../src/client.js";
import { mockFetch } from "../support/mock-fetch.js";

describe("ContactsResource", () => {
  it("get() uses singular /contact/{id} path", async () => {
    const mocked = mockFetch([
      { status: 200, body: { data: { id: "cnt_1" } } },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.contacts.get("cnt_1");

    expect(mocked.last().url).toContain("/contact/cnt_1");
    expect(mocked.last().url).not.toContain("/contacts/cnt_1");
  });

  it("create() omits undefined fields", async () => {
    const mocked = mockFetch([
      { status: 201, body: { data: { id: "cnt_new" } } },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.contacts.create({ numbers: ["+1"], name: "John" });

    const body = mocked.last().body as Record<string, unknown>;
    expect(body.numbers).toEqual(["+1"]);
    expect(body.name).toBe("John");
    expect(body).not.toHaveProperty("last_name");
    expect(body).not.toHaveProperty("emails");
  });

  it("search() defaults to page=0 size=10", async () => {
    const mocked = mockFetch([
      {
        status: 200,
        body: {
          data: {
            results: [],
            metadata: { pagination: { total_pages: 0, current_page: 0 } },
          },
        },
      },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.contacts.search();

    expect(mocked.last().url).toContain("page=0");
    expect(mocked.last().url).toContain("size=10");
  });

  it("searchConversation() uses the /conversation sub-path", async () => {
    const mocked = mockFetch([
      {
        status: 200,
        body: {
          data: {
            results: [],
            metadata: { pagination: { total_pages: 0, current_page: 0 } },
          },
        },
      },
    ]);
    const client = new WithalloClient({ apiKey: "k", fetch: mocked.fetch });

    await client.contacts.searchConversation("cnt_1", 2, 50);

    expect(mocked.last().url).toContain("/contact/cnt_1/conversation");
    expect(mocked.last().url).toContain("page=2");
    expect(mocked.last().url).toContain("size=50");
  });
});
