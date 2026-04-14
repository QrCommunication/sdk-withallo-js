---
name: sdk-withallo-js
description: Use when working with the Withallo (Allo) telephony/SMS/contacts API from JavaScript or TypeScript. Covers the isomorphic core (Node, browser, Deno, React Native) plus optional React hooks from `@qrcommunication/withallo-sdk/react`. Supports webhook CRUD + incoming webhook parsing, calls search, contacts CRUD + conversation history, SMS (US + France), and phone numbers listing.
---

# Withallo SDK (TypeScript) — Reference

TypeScript SDK for the Withallo API. Isomorphic core + optional React hooks.

## Package

| Language | Package | Repo |
|----------|---------|------|
| TypeScript (ESM + CJS) | `@qrcommunication/withallo-sdk` | `QrCommunication/sdk-withallo-js` |

## Install

```bash
npm install @qrcommunication/withallo-sdk
# or: pnpm add / yarn add / bun add
```

## Entry points

```typescript
// Core — works everywhere fetch is available
import { WithalloClient, WebhookReceiver, WebhookTopic } from "@qrcommunication/withallo-sdk";

// React-specific helpers (peer dep: React 18 or 19)
import { WithalloProvider, useSendSms, useWebhooks } from "@qrcommunication/withallo-sdk/react";
```

## Quick Start

```typescript
const client = new WithalloClient({ apiKey: process.env.WITHALLO_API_KEY! });

// Subscribe to events
await client.webhooks.create({
  alloNumber: "+1234567890",
  url: "https://example.com/webhooks/allo",
  topics: [WebhookTopic.CALL_RECEIVED, WebhookTopic.SMS_RECEIVED],
});

// Send SMS
await client.sms.send({ from: "+1234567890", to: "+0987654321", message: "Hello" });
await client.sms.sendFrance({ senderId: "MyCompany", to: "+33612345678", message: "Bonjour" });

// Parse incoming webhook
const receiver = client.webhookReceiver();
receiver.on(WebhookTopic.CALL_RECEIVED, (event) => handleCall(event));
await receiver.handle(rawBodyString);
```

## Architecture

```
WithalloClient
├── webhooks       → WebhooksResource
│   ├── list()
│   ├── create({ alloNumber, url, topics, enabled? })
│   └── delete(webhookId)
├── calls          → CallsResource
│   └── search({ alloNumber, contactNumber?, page?, size? })
├── contacts       → ContactsResource
│   ├── get(contactId)                         (GET /contact/{id} — singular)
│   ├── search(page?, size?)
│   ├── searchConversation(contactId, p?, s?)
│   ├── create({ numbers, name?, lastName?, jobTitle?, website?, emails?, company? })
│   └── update(contactId, fields)
├── sms            → SmsResource
│   ├── send({ from, to, message })
│   └── sendFrance({ senderId, to, message })
├── phoneNumbers   → PhoneNumbersResource
│   └── list()
└── webhookReceiver() → WebhookReceiver
    ├── on(WebhookTopic, handler)
    ├── parse(rawBody): WebhookEvent
    ├── dispatch(event): Promise<number>
    └── handle(rawBody): Promise<WebhookEvent>
```

## Authentication

- Single auth method: raw API key in the `Authorization` header.
- **No `Bearer ` prefix** — key is sent verbatim.
- 401 → `AuthenticationError`.
- 403 → `ForbiddenError` with `requiredScopes(): string[]`.

## React hooks

| Hook | Returns |
|------|---------|
| `useWithallo()` | `WithalloClient` |
| `useSendSms()` | `{ run, data, error, isPending, isSuccess, isError, reset }` |
| `useSendSmsFrance()` | Same shape, calls `sendFrance()` |
| `useWebhooks()` | `{ webhooks, isLoading, error, refresh }` (auto-fetches) |
| `useCreateWebhook()` | Mutation with pending state |
| `useDeleteWebhook()` | Mutation with pending state |
| `useAsyncAction(fn)` | Low-level wrapper for any async fn |

**IMPORTANT**: never expose your API key to browser bundles in a public app. Proxy via your backend.

## Webhook security (April 2026)

The Withallo public docs do NOT specify an HMAC header for webhook authenticity verification. Harden with:
- HTTPS-only endpoint
- Secret URL path
- Whitelist Withallo egress IPs
- Drop payloads whose `allo_number` is not one of yours
- Respond 200 within 30s

## Errors

```
WithalloError
├── ApiError (httpStatus, responseBody, getErrorCode(), getDetails())
│   ├── AuthenticationError (401)
│   ├── ForbiddenError (403 — requiredScopes())
│   ├── ValidationError (400/422 — errors())
│   ├── NotFoundError (404)
│   └── RateLimitError (429 — retryAfterSeconds)
└── InvalidWebhookPayloadError
```

## Gotchas

1. **No `Bearer` prefix** on `Authorization`.
2. `GET /contact/{id}` is **singular**; `POST/PUT/LIST /contacts` are plural.
3. France SMS uses `sender_id`, not `from`, and requires a pre-verified Sender ID.
4. Pagination is **0-indexed**.
5. Webhook endpoints must answer 200 within 30s.
6. Never ship the API key in a browser bundle — proxy server-side.

## References

- API docs (EN): https://help.withallo.com/en/api-reference/introduction
- API docs (FR): https://help.withallo.com/fr/api-reference/introduction
- PHP SDK: https://github.com/QrCommunication/sdk-withallo-php
