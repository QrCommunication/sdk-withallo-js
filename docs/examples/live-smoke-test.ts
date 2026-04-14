/**
 * Live smoke test against the real Withallo API.
 *
 * Usage:
 *   WITHALLO_API_KEY=xxx node --loader tsx docs/examples/live-smoke-test.ts
 *
 *   # Or with an SMS target (will attempt to send, may fail if your sender
 *   # ID is not pre-verified by Allo support):
 *   WITHALLO_API_KEY=xxx WITHALLO_SMS_TO=+33612345678 \
 *     node --loader tsx docs/examples/live-smoke-test.ts
 *
 * What it does:
 *   1. testConnection()
 *   2. list phone numbers
 *   3. list webhooks
 *   4. create + delete a disabled test webhook
 *   5. search contacts (page 0)
 *   6. (optional) send one SMS to WITHALLO_SMS_TO
 *
 * No data is mutated except for the transient test webhook which is deleted
 * immediately.
 */

import {
  WithalloClient,
  WebhookTopic,
  ApiError,
  ForbiddenError,
} from "@qrcommunication/withallo-sdk";

const apiKey = process.env.WITHALLO_API_KEY;
if (!apiKey) {
  console.error("WITHALLO_API_KEY is not set");
  process.exit(1);
}

const client = new WithalloClient({ apiKey });

console.log("=== Withallo SDK live smoke test ===\n");

process.stdout.write("[1] testConnection()... ");
console.log((await client.testConnection()) ? "OK" : "FAILED");

console.log("\n[2] phoneNumbers.list()");
try {
  const numbers = await client.phoneNumbers.list();
  console.log(`    count: ${numbers.length}`);
  for (const n of numbers) {
    console.log(`    - ${n.number} (${n.name}, ${n.country})`);
  }
} catch (err) {
  reportError(err);
}

console.log("\n[3] webhooks.list()");
try {
  const webhooks = await client.webhooks.list();
  console.log(`    count: ${webhooks.length}`);
} catch (err) {
  reportError(err);
}

console.log("\n[4] webhooks.create() + delete()");
try {
  const numbers = await client.phoneNumbers.list();
  const firstNumber = numbers[0]?.number;
  if (!firstNumber) {
    console.log("    skipped (no phone numbers on the account)");
  } else {
    const created = await client.webhooks.create({
      alloNumber: firstNumber,
      url: `https://example.invalid/hook/${Math.random().toString(36).slice(2)}`,
      topics: [WebhookTopic.CALL_RECEIVED],
      enabled: false,
    });
    console.log(`    created id=${created.id ?? "n/a"}`);
    if (created.id) {
      await client.webhooks.delete(created.id);
      console.log("    deleted OK");
    }
  }
} catch (err) {
  reportError(err);
}

console.log("\n[5] contacts.search(0, 5)");
try {
  const page = await client.contacts.search(0, 5);
  const total = page.metadata?.pagination?.total_pages ?? "?";
  console.log(`    results=${page.results?.length ?? 0} total_pages=${total}`);
} catch (err) {
  reportError(err);
}

const smsTarget = process.env.WITHALLO_SMS_TO;
if (smsTarget) {
  console.log(`\n[6] sms.sendFrance() -> ${smsTarget}`);
  try {
    const result = await client.sms.sendFrance({
      senderId: "QrCom",
      to: smsTarget,
      message: `Withallo SDK smoke test ${new Date().toISOString().slice(11, 19)}`,
    });
    console.log(`    sent: ${JSON.stringify(result)}`);
  } catch (err) {
    reportError(err);
  }
}

console.log("\n=== DONE ===");

function reportError(err: unknown) {
  if (err instanceof ForbiddenError) {
    console.log(`    FORBIDDEN: missing=${err.requiredScopes().join(",")}`);
  } else if (err instanceof ApiError) {
    console.log(
      `    ERROR ${err.httpStatus}: ${err.message} body=${JSON.stringify(err.responseBody)}`,
    );
  } else {
    console.log(`    ${(err as Error).message}`);
  }
}
