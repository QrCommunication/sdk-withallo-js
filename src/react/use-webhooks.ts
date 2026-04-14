import { useEffect, useMemo, useState } from "react";
import type { CreateWebhookInput, Webhook } from "../types/webhook.js";
import { useWithallo } from "./context.js";
import { useAsyncAction, type AsyncAction } from "./use-async-action.js";

interface UseWebhooksResult {
  webhooks: Webhook[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/** Fetches the current list of webhook configurations (auto-fetch on mount). */
export function useWebhooks(): UseWebhooksResult {
  const client = useWithallo();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useMemo(
    () => async () => {
      setIsLoading(true);
      setError(null);
      try {
        setWebhooks(await client.webhooks.list());
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [client],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await client.webhooks.list();
        if (!cancelled) {
          setWebhooks(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  return { webhooks, isLoading, error, refresh: load };
}

/** Imperative action to create a webhook with pending/error state. */
export function useCreateWebhook(): AsyncAction<[CreateWebhookInput], Webhook> {
  const client = useWithallo();
  const fn = useMemo(
    () => (input: CreateWebhookInput) => client.webhooks.create(input),
    [client],
  );
  return useAsyncAction(fn);
}

/** Imperative action to delete a webhook. */
export function useDeleteWebhook(): AsyncAction<[string], void> {
  const client = useWithallo();
  const fn = useMemo(
    () => (webhookId: string) => client.webhooks.delete(webhookId),
    [client],
  );
  return useAsyncAction(fn);
}
