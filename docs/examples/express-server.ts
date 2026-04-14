/**
 * Express server — outbound API + webhook receiver
 *
 * Run:
 *   WITHALLO_API_KEY=xxx WEBHOOK_SECRET=yyy node --loader tsx docs/examples/express-server.ts
 *
 * Endpoints exposed:
 *   POST /api/sms           — sends an SMS via the SDK (from your backend)
 *   POST /api/webhooks/allo — receives Withallo webhooks
 */

import express from "express";
import { WithalloClient, WebhookTopic } from "@qrcommunication/withallo-sdk";

const app = express();
app.use(express.json());
// Keep the RAW body for the webhook route (we parse it ourselves).
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json", limit: "1mb" }),
);

const client = new WithalloClient({
  apiKey: process.env.WITHALLO_API_KEY!,
});

// ---- Outbound: server-side SMS sender ---------------------------------------

app.post("/api/sms", async (req, res) => {
  const { from, to, message } = req.body as {
    from: string;
    to: string;
    message: string;
  };

  try {
    const result = await client.sms.send({ from, to, message });
    res.json({ ok: true, result });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "httpStatus" in err
        ? (err as { httpStatus: number }).httpStatus
        : 500;
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(status >= 400 ? status : 500)
      .json({ ok: false, error: message });
  }
});

// ---- Inbound: webhook receiver ---------------------------------------------

const receiver = client.webhookReceiver();

receiver.on(WebhookTopic.CALL_RECEIVED, async (event) => {
  const callId = event.get<string>("id");
  const summary = event.get<string>("one_sentence_summary");
  console.log(`[call] ${callId} — ${summary}`);
});

receiver.on(WebhookTopic.SMS_RECEIVED, async (event) => {
  if (event.get<string>("direction") === "INBOUND") {
    console.log(
      `[sms] from=${event.get("from_number")} content=${event.get("content")}`,
    );
  }
});

app.post("/api/webhooks/allo", async (req, res) => {
  // Origin hardening: require a secret token in the URL
  if (req.query.token !== process.env.WEBHOOK_SECRET) {
    res.status(404).end();
    return;
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : String(req.body);

  try {
    await receiver.handle(rawBody);
    res.status(200).end();
  } catch (err) {
    console.error("[withallo] webhook failed:", err);
    res.status(400).end();
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Withallo example server listening on :${port}`);
});
