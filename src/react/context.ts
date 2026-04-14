import { createContext, useContext } from "react";
import type { WithalloClient } from "../client.js";

export const WithalloContext = createContext<WithalloClient | null>(null);

/**
 * Access the {@link WithalloClient} provided via {@link WithalloProvider}.
 *
 * Throws if no provider is present in the tree.
 */
export function useWithallo(): WithalloClient {
  const client = useContext(WithalloContext);
  if (client === null) {
    throw new Error(
      "useWithallo() must be called inside <WithalloProvider>. Wrap your app with `<WithalloProvider client={...}>`.",
    );
  }
  return client;
}
