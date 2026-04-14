import { describe, expect, it } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { useEffect } from "react";
import { WithalloProvider } from "../../src/react/provider.js";
import { useSendSms } from "../../src/react/use-send-sms.js";
import { mockFetch } from "../support/mock-fetch.js";

describe("useSendSms", () => {
  it("exposes pending/success state and returns the SDK result", async () => {
    const mocked = mockFetch([
      {
        status: 200,
        body: { data: { from_number: "+1", to_number: "+2", content: "hi" } },
      },
    ]);

    const { result } = renderHook(() => useSendSms(), {
      wrapper: ({ children }) => (
        <WithalloProvider options={{ apiKey: "k", fetch: mocked.fetch }}>
          {children}
        </WithalloProvider>
      ),
    });

    expect(result.current.isPending).toBe(false);

    await act(async () => {
      await result.current.run({ from: "+1", to: "+2", message: "hi" });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data?.content).toBe("hi");
    expect(result.current.isPending).toBe(false);
    expect(mocked.last().method).toBe("POST");
  });

  it("throws a clear error when used outside a provider", () => {
    function Consumer() {
      useSendSms();
      return null;
    }

    // Silence React's expected error log in this test
    const err = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Consumer />)).toThrow(/WithalloProvider/);
    } finally {
      console.error = err;
    }
  });

  it("useWithallo accessible via the provider", async () => {
    const mocked = mockFetch([{ status: 200, body: { data: [] } }]);

    function TestComponent() {
      const sms = useSendSms();
      useEffect(() => {
        // no-op — we just want the hook to subscribe cleanly
      }, [sms]);
      return <span>{sms.isPending ? "pending" : "idle"}</span>;
    }

    render(
      <WithalloProvider options={{ apiKey: "k", fetch: mocked.fetch }}>
        <TestComponent />
      </WithalloProvider>,
    );

    expect(screen.getByText("idle")).toBeDefined();
  });
});
