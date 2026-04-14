import { vi } from "vitest";

export interface MockedResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface MockFetchHistory {
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
}

export interface MockedFetch {
  fetch: typeof fetch;
  history: MockFetchHistory[];
  last(): MockFetchHistory;
}

export function mockFetch(responses: MockedResponse[]): MockedFetch {
  const history: MockFetchHistory[] = [];
  let index = 0;

  const impl: typeof fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        input instanceof URL
          ? input.toString()
          : typeof input === "string"
            ? input
            : input.url;
      const method = (init?.method ?? "GET").toUpperCase();
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          for (const [key, value] of init.headers) headers[key] = value;
        } else {
          Object.assign(headers, init.headers);
        }
      }
      let body: unknown = null;
      if (typeof init?.body === "string" && init.body !== "") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = init.body;
        }
      }

      history.push({ url, method, body, headers });

      if (index >= responses.length) {
        throw new Error(
          `mockFetch: no more responses queued (call #${index + 1})`,
        );
      }
      const response = responses[index++]!;
      const payload =
        response.body === undefined ? "" : JSON.stringify(response.body);
      return new Response(payload, {
        status: response.status,
        headers: response.headers ?? { "Content-Type": "application/json" },
      });
    },
  );

  return {
    fetch: impl,
    history,
    last(): MockFetchHistory {
      if (history.length === 0) {
        throw new Error("mockFetch: no requests recorded yet.");
      }
      return history[history.length - 1]!;
    },
  };
}
