import { useMemo, type ReactNode } from "react";
import { WithalloClient, type WithalloClientOptions } from "../client.js";
import { WithalloContext } from "./context.js";

export interface WithalloProviderProps {
  /** An existing client instance. Takes precedence over `options`. */
  client?: WithalloClient;
  /** If `client` is not provided, a new client is built from these options. */
  options?: WithalloClientOptions;
  children: ReactNode;
}

/**
 * Provides a {@link WithalloClient} to the React tree.
 *
 *   <WithalloProvider options={{ apiKey: process.env.WITHALLO_KEY! }}>
 *     <App />
 *   </WithalloProvider>
 *
 * Or pass an existing client (useful when the client is created outside React):
 *
 *   <WithalloProvider client={myClient}>...</WithalloProvider>
 */
export function WithalloProvider({
  client,
  options,
  children,
}: WithalloProviderProps): ReactNode {
  const value = useMemo(() => {
    if (client) return client;
    if (!options) {
      throw new Error(
        "WithalloProvider: provide either `client` or `options`.",
      );
    }
    return new WithalloClient(options);
  }, [client, options]);

  return (
    <WithalloContext.Provider value={value}>
      {children}
    </WithalloContext.Provider>
  );
}
