/**
 * Next.js (App Router) — Webhook Route Handler
 *
 * File: app/api/webhooks/allo/route.ts
 *
 * Receives Withallo webhook events (CALL_RECEIVED, SMS_RECEIVED, etc.),
 * dispatches to dedicated handlers, and always replies with 200 within 30s.
 *
 * Prerequisites:
 *   - Register the webhook URL in Withallo: POST /webhooks with this route's
 *     public URL in `url`.
 *   - Store the Allo API key in WITHALLO_API_KEY (server-side only, NEVER
 *     prefix with NEXT_PUBLIC_).
 *   - Add an unguessable token in the path segment for a lightweight origin
 *     filter since Withallo does not (yet) publish an HMAC signature.
 */

import { WebhookReceiver, WebhookTopic } from "@qrcommunication/withallo-sdk";
import type {
  CallReceivedPayload,
  SmsReceivedPayload,
  ContactEventPayload,
} from "@qrcommunication/withallo-sdk";

// One receiver instance per process — handlers are stateless relative to HTTP.
const receiver = new WebhookReceiver();

receiver
  .on(WebhookTopic.CALL_RECEIVED, async (event) => {
    const payload = event.data as CallReceivedPayload;
    // Persist, trigger alerts, update CRM...
    console.log(
      `[withallo] call ${payload.id} — ${payload.result} — ${payload.length}`,
    );
  })
  .on(WebhookTopic.SMS_RECEIVED, async (event) => {
    const payload = event.data as SmsReceivedPayload;
    if (payload.direction === "INBOUND") {
      // Reply logic, keyword routing, CRM update...
      console.log(
        `[withallo] inbound SMS from ${payload.from_number}: ${payload.content}`,
      );
    }
  })
  .on(WebhookTopic.CONTACT_CREATED, async (event) => {
    const payload = event.data as ContactEventPayload;
    console.log(`[withallo] contact created: ${payload.id}`);
  })
  .on(WebhookTopic.CONTACT_UPDATED, async (event) => {
    const payload = event.data as ContactEventPayload;
    console.log(`[withallo] contact updated: ${payload.id}`);
  });

export async function POST(request: Request): Promise<Response> {
  // Origin-hardening: the URL path includes a per-deployment secret.
  // Replace WEBHOOK_SECRET with your own env and compare in constant time.
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token !== process.env.WEBHOOK_SECRET) {
    return new Response(null, { status: 404 }); // pretend route doesn't exist
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    await receiver.handle(rawBody);
    return new Response(null, { status: 200 });
  } catch (err) {
    // InvalidWebhookPayloadError or anything thrown inside a handler.
    // Return 400 so Withallo surfaces an error; use a proper logger in prod.
    console.error("[withallo] webhook processing failed:", err);
    return new Response(null, { status: 400 });
  }
}

// Disable Next.js auto-parsing — we read raw body above.
export const dynamic = "force-dynamic";
