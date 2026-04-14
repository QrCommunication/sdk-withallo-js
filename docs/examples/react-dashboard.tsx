/**
 * React — Admin dashboard panel using the SDK hooks.
 *
 * Lists webhooks, lets the user create a new subscription, delete one, and
 * send a test SMS. All through the hooks exposed by
 * `@qrcommunication/withallo-sdk/react`.
 *
 * SECURITY: this example runs the SDK client-side with a raw API key, which
 * is acceptable only for an internal admin UI fetched through an authenticated
 * backend proxy, or for a Node-rendered dashboard. For public-facing pages,
 * proxy every call through your own authenticated server — never ship the raw
 * Withallo API key to end users.
 */

import { useState } from "react";
import {
  WithalloProvider,
  useSendSms,
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
} from "@qrcommunication/withallo-sdk/react";
import { WebhookTopic } from "@qrcommunication/withallo-sdk";

export function Dashboard({ apiKey }: { apiKey: string }): JSX.Element {
  return (
    <WithalloProvider options={{ apiKey }}>
      <WebhooksPanel />
      <SendSmsPanel />
    </WithalloProvider>
  );
}

function WebhooksPanel(): JSX.Element {
  const { webhooks, isLoading, error, refresh } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [url, setUrl] = useState("");
  const [alloNumber, setAlloNumber] = useState("");

  const handleCreate = async () => {
    await createWebhook.run({
      alloNumber,
      url,
      topics: [WebhookTopic.CALL_RECEIVED, WebhookTopic.SMS_RECEIVED],
      enabled: true,
    });
    await refresh();
    setUrl("");
    setAlloNumber("");
  };

  return (
    <section>
      <h2>Webhooks</h2>

      {isLoading ? (
        <p>Loading…</p>
      ) : error ? (
        <p role="alert">Error: {error.message}</p>
      ) : (
        <ul>
          {webhooks.map((w) => (
            <li key={w.id ?? w.url}>
              <code>{w.url}</code> → {(w.topics ?? []).join(", ")}
              {w.id && (
                <button
                  disabled={deleteWebhook.isPending}
                  onClick={async () => {
                    await deleteWebhook.run(w.id!);
                    await refresh();
                  }}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleCreate();
        }}
      >
        <h3>Create webhook</h3>
        <label>
          Allo number
          <input
            required
            value={alloNumber}
            onChange={(e) => setAlloNumber(e.target.value)}
            placeholder="+33188833451"
          />
        </label>
        <label>
          URL
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks/allo"
          />
        </label>
        <button disabled={createWebhook.isPending}>
          {createWebhook.isPending ? "Creating…" : "Create"}
        </button>
        {createWebhook.error && (
          <p role="alert">{createWebhook.error.message}</p>
        )}
      </form>
    </section>
  );
}

function SendSmsPanel(): JSX.Element {
  const sendSms = useSendSms();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section>
      <h2>Send SMS</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await sendSms.run({ from, to, message });
        }}
      >
        <input
          required
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From (+1…)"
        />
        <input
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To (+1…)"
        />
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
        />
        <button disabled={sendSms.isPending}>
          {sendSms.isPending ? "Sending…" : "Send"}
        </button>
      </form>

      {sendSms.isSuccess && <p>Sent ✓</p>}
      {sendSms.error && <p role="alert">{sendSms.error.message}</p>}
    </section>
  );
}
