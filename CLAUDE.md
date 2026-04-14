# Withallo SDK (TypeScript) — AI Instructions

> Ce fichier est automatiquement detecte par Claude Code, Cursor, Copilot et Codex.

## SDK Overview

Package npm `@qrcommunication/withallo-sdk` pour l'API Withallo (Allo).
SDK **isomorphe** : core utilisable partout (Node 18+, browser, Deno, React Native, edge)
+ sous-module `/react` (`@qrcommunication/withallo-sdk/react`) avec hooks.

## Entry Points

```typescript
// Core — Node, browser, Deno, React Native, edge
import { WithalloClient, WebhookReceiver, WebhookTopic } from "@qrcommunication/withallo-sdk";

// React hooks — navigateur / SSR
import { WithalloProvider, useSendSms, useWebhooks } from "@qrcommunication/withallo-sdk/react";
```

## Architecture

```
WithalloClient (entry point)
|-- webhooks       -> WebhooksResource      (scope WEBHOOKS_READ_WRITE)
|-- calls          -> CallsResource         (scope CONVERSATIONS_READ)
|-- contacts       -> ContactsResource      (scopes CONTACTS_READ / CONTACTS_READ_WRITE)
|-- sms            -> SmsResource           (scope SMS_SEND)
|-- phoneNumbers   -> PhoneNumbersResource  (scope CONVERSATIONS_READ)
|-- webhookReceiver() -> WebhookReceiver    (parsing + dispatch, no network)
```

## API Withallo — faits essentiels

- **Base URL** : `https://api.withallo.com/v1/api`
- **Auth** : header `Authorization: <API_KEY>` (**PAS de `Bearer`**, la clef est brute)
- **Erreurs** :
  - 401 `{"code":"API_KEY_INVALID"}`
  - 403 `{"code":"API_KEY_INSUFFICIENT_SCOPE","details":[{"message":"required=SCOPE_NAME","field":"scope"}]}`
  - 429 avec header `Retry-After`
- **Pagination** : `page` (0-indexed) + `size` (1..100, defaut 10). Metadonnees dans `data.metadata.pagination`.
- **Webhooks entrants** : enveloppe `{"topic": "...", "data": {...}}`. 4 topics : `CALL_RECEIVED`, `SMS_RECEIVED`, `CONTACT_CREATED`, `CONTACT_UPDATED`. **Pas de signature HMAC publiee** a ce jour.

## Instanciation

```typescript
import { WithalloClient } from "@qrcommunication/withallo-sdk";

const client = new WithalloClient({
  apiKey: process.env.WITHALLO_API_KEY!,
});

// Options supplementaires :
const client = new WithalloClient({
  apiKey: "...",
  environment: Environment.PRODUCTION,
  timeoutMs: 30_000,
  userAgent: "my-app/1.0",
  fetch: customFetch,  // polyfill / mock
  httpClient: customHttpClient,  // remplace entierement le HttpClient
});
```

## Patterns d'implementation

### Creer un webhook

```typescript
import { WebhookTopic } from "@qrcommunication/withallo-sdk";

await client.webhooks.create({
  alloNumber: "+1234567890",
  url: "https://example.com/webhooks/allo",
  topics: [WebhookTopic.CALL_RECEIVED, WebhookTopic.SMS_RECEIVED],
  enabled: true,
});
```

### Recevoir un webhook (Node / Next.js / Express)

```typescript
const receiver = client.webhookReceiver();
receiver.on(WebhookTopic.CALL_RECEIVED, async (event) => {
  const callId = event.get<string>("id");
  // ...
});

// Next.js App Router
export async function POST(request: Request) {
  await receiver.handle(await request.text());
  return new Response(null, { status: 200 });
}
```

### Envoyer un SMS

```typescript
// US / International
await client.sms.send({ from: "+1234567890", to: "+0987654321", message: "Hello" });

// France — sender ID verifie requis
await client.sms.sendFrance({ senderId: "MyCorp", to: "+33612345678", message: "Bonjour" });
```

### Contacts

```typescript
// GET utilise le path SINGULIER /contact/{id} (convention Withallo, pas une typo)
await client.contacts.get("cnt_abc123");

// POST/PUT/SEARCH utilisent /contacts (pluriel)
await client.contacts.create({ numbers: ["+15551234567"], name: "John" });
await client.contacts.update("cnt_abc123", { last_name: "Smith" });
await client.contacts.search(0, 20);

// Historique d'un contact
await client.contacts.searchConversation("cnt_abc123", 0, 20);
```

### React

```tsx
import { WithalloProvider, useSendSms } from "@qrcommunication/withallo-sdk/react";

<WithalloProvider options={{ apiKey: "..." }}>
  <App />
</WithalloProvider>

// Dans un composant :
const { run, isPending, error } = useSendSms();
await run({ from: "+1", to: "+2", message: "hi" });
```

## Enums

```typescript
import {
  Environment,
  Scope,
  WebhookTopic,
  CallResult,
  CallType,
  SmsType,
  SmsDirection,
} from "@qrcommunication/withallo-sdk";
```

Ce sont des `as const` objects qui exposent aussi un type identiquement nomme.

## Erreurs

```
WithalloError
|-- ApiError                      (httpStatus, responseBody, getErrorCode(), getDetails())
|   |-- AuthenticationError       (401)
|   |-- ForbiddenError            (403 — requiredScopes(): string[])
|   |-- ValidationError           (400/422 — errors(): Record<string, string>)
|   |-- NotFoundError             (404)
|   |-- RateLimitError            (429 — retryAfterSeconds: number | null)
|-- InvalidWebhookPayloadError    (payload webhook malforme)
```

## Pieges a eviter

1. **NE JAMAIS** prefixer l'API key avec `Bearer ` — Withallo attend la clef brute dans `Authorization`.
2. Le GET contact utilise `/contact/{id}` (singulier), pas `/contacts/{id}`. Convention Withallo.
3. SMS France : `sender_id` (snake_case) dans le body, pas `from`. Sender ID doit etre pre-verifie.
4. Les payloads webhook n'ont pas de signature cryptographique publique a ce jour.
5. Repondre 200 aux webhooks en moins de 30s.
6. Pagination : `page` est **0-indexed**.
7. NE JAMAIS exposer l'API key cote client dans une app publique (`NEXT_PUBLIC_*`, bundle navigateur). Proxy-la via votre backend.

## Conventions de code

- TypeScript 5.8+, `strict: true`, `noUncheckedIndexedAccess: true`
- ESM-first (`"type": "module"`), avec build CJS parallele via tsup
- `fetch` natif (pas de dependance runtime)
- React en `peerDependency` optionnelle
- Vitest + happy-dom + @testing-library/react pour les tests
- Prettier (double quotes, trailing commas)

## Tests

```bash
pnpm test              # vitest run
pnpm test:watch        # watch mode
pnpm typecheck         # tsc --noEmit
pnpm build             # tsup (ESM + CJS + d.ts)
```

Pattern de test : `mockFetch(responses)` dans `tests/support/mock-fetch.ts` permet d'injecter un `fetch` factice via `WithalloClient({ apiKey, fetch: mock.fetch })`.

## Release workflow

Tag-based, inspired by the QrCommunication/scell-sdk-js pattern.

1. Bump `version` in `package.json`.
2. Add a new section to `CHANGELOG.md` under `## [X.Y.Z] - YYYY-MM-DD`.
3. Commit both: `git commit -am "chore: release vX.Y.Z"`.
4. Tag and push:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push && git push origin vX.Y.Z
   ```
5. The `release.yml` workflow runs automatically on the tag:
   - `build` — install, typecheck, test, build
   - `publish` — `npm publish --access public --provenance` via OIDC Trusted Publishing (no `NPM_TOKEN` secret needed; configure a trusted publisher on npmjs.com once)
   - `github-release` — creates a GitHub Release with notes extracted from `CHANGELOG.md`

## Dev dependencies

- **vitest** 3.2+ (includes patched vite 6+)
- **happy-dom** 20.9+ (CVE-2024 VM context escape fixed)
- **@vitest/coverage-v8** 3.2+
- **tsup** 8.5+ (with esbuild 0.27+)

Dev deps are reviewed via Dependabot on the repo.
