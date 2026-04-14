# Withallo SDK — JavaScript / TypeScript

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/QrCommunication/sdk-withallo-js/releases)
[![npm](https://img.shields.io/npm/v/@qrcommunication/withallo-sdk.svg)](https://www.npmjs.com/package/@qrcommunication/withallo-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://github.com/QrCommunication/sdk-withallo-js/actions/workflows/tests.yml/badge.svg)](https://github.com/QrCommunication/sdk-withallo-js/actions/workflows/tests.yml)

SDK TypeScript **isomorphe** pour l'API [Withallo (Allo)](https://help.withallo.com/en/api-reference/introduction). Core utilisable partout (Node 18+, navigateurs modernes, Deno, React Native, edge runtimes) + un sous-module `/react` avec des hooks prêts à l'emploi.

Couvre les 5 domaines de l'API publique : **Webhooks**, **Calls**, **Contacts**, **SMS**, **Phone Numbers**, plus un **WebhookReceiver** pour traiter les événements entrants (`CALL_RECEIVED`, `SMS_RECEIVED`, `CONTACT_CREATED`, `CONTACT_UPDATED`).

---

## Installation

```bash
# npm
npm install @qrcommunication/withallo-sdk

# pnpm
pnpm add @qrcommunication/withallo-sdk

# yarn
yarn add @qrcommunication/withallo-sdk

# bun
bun add @qrcommunication/withallo-sdk
```

**Prérequis / Requirements** : `fetch` global (Node 18+, navigateurs modernes, Deno, Bun). Passez un polyfill via `options.fetch` si votre runtime n'en a pas.

Générez votre clé API depuis [web.withallo.com/settings/api](https://web.withallo.com/settings/api).

---

## Table des matières / Table of contents

- [Démarrage rapide / Quick start](#démarrage-rapide--quick-start)
- [Utilisation avec React](#utilisation-avec-react--react-usage)
- [Référence des ressources / Resources reference](#référence-des-ressources--resources-reference)
- [WebhookReceiver — réception des événements](#webhookreceiver--réception-des-événements)
- [Gestion d'erreurs / Error handling](#gestion-derreurs--error-handling)
- [Sécurité des webhooks / Webhook security](#sécurité-des-webhooks--webhook-security)
- [Développement / Development](#développement--development)

---

## Démarrage rapide / Quick start

### Core TypeScript (Node, browser, Deno, React Native)

```typescript
import { WithalloClient, WebhookTopic } from "@qrcommunication/withallo-sdk";

const client = new WithalloClient({
  apiKey: process.env.WITHALLO_API_KEY!,
});

// Créer un webhook / Create a webhook
await client.webhooks.create({
  alloNumber: "+1234567890",
  url: "https://example.com/webhooks/allo",
  topics: [WebhookTopic.CALL_RECEIVED, WebhookTopic.SMS_RECEIVED],
});

// Envoyer un SMS (US) / Send SMS (US)
await client.sms.send({
  from: "+1234567890",
  to: "+0987654321",
  message: "Hello from Withallo SDK",
});

// Envoyer un SMS France (Sender ID vérifié requis)
await client.sms.sendFrance({
  senderId: "MyCompany",
  to: "+33612345678",
  message: "Bonjour depuis le SDK Withallo",
});

// Rechercher des appels / Search calls
const result = await client.calls.search({
  alloNumber: "+1234567890",
  size: 50,
});

// Tester la connexion / Test connectivity
await client.testConnection(); // Promise<boolean>
```

---

## Utilisation avec React / React usage

Le package expose un point d'entrée séparé `@qrcommunication/withallo-sdk/react` avec un provider et des hooks.

```tsx
import { WithalloProvider, useSendSms, useWebhooks } from "@qrcommunication/withallo-sdk/react";

// 1. Envelopper votre app
function App() {
  return (
    <WithalloProvider options={{ apiKey: process.env.NEXT_PUBLIC_WITHALLO_KEY! }}>
      <Dashboard />
    </WithalloProvider>
  );
}

// 2. Utiliser les hooks
function SendSmsForm() {
  const { run, isPending, error, isSuccess } = useSendSms();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void run({
          from: form.get("from") as string,
          to: form.get("to") as string,
          message: form.get("message") as string,
        });
      }}
    >
      <input name="from" placeholder="+1..." />
      <input name="to" placeholder="+1..." />
      <textarea name="message" />
      <button disabled={isPending}>
        {isPending ? "Sending..." : "Send SMS"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {isSuccess && <p>Sent ✓</p>}
    </form>
  );
}

function WebhooksList() {
  const { webhooks, isLoading, error, refresh } = useWebhooks();

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {webhooks.map((w) => (
        <li key={w.id ?? w.url}>
          {w.url} → {w.topics.join(", ")}
        </li>
      ))}
      <button onClick={() => void refresh()}>Refresh</button>
    </ul>
  );
}
```

> **Sécurité** : n'exposez **jamais** votre API key via `NEXT_PUBLIC_*` en production. Pour des apps publiques, passez par votre propre backend en proxy. Le hook sert principalement aux dashboards admin côté serveur ou à des intégrations Node.

### Hooks disponibles

| Hook | Description |
|------|-------------|
| `useWithallo()` | Retourne le `WithalloClient` courant (lève si pas de provider) |
| `useSendSms()` | Mutation `client.sms.send()` avec `isPending / data / error` |
| `useSendSmsFrance()` | Mutation `client.sms.sendFrance()` |
| `useWebhooks()` | Query auto-fetch de la liste des webhooks + `refresh()` |
| `useCreateWebhook()` | Mutation `client.webhooks.create()` |
| `useDeleteWebhook()` | Mutation `client.webhooks.delete()` |
| `useAsyncAction(fn)` | Hook bas-niveau pour wrapper n'importe quelle action async |

Tous les hooks `useXxxAction` retournent `{ data, error, isPending, isSuccess, isError, run, reset }`.

---

## Référence des ressources / Resources reference

### Architecture

```
WithalloClient
 ├─ webhooks       → WebhooksResource      (scope: WEBHOOKS_READ_WRITE)
 ├─ calls          → CallsResource         (scope: CONVERSATIONS_READ)
 ├─ contacts       → ContactsResource      (scopes: CONTACTS_READ / CONTACTS_READ_WRITE)
 ├─ sms            → SmsResource           (scope: SMS_SEND)
 ├─ phoneNumbers   → PhoneNumbersResource  (scope: CONVERSATIONS_READ)
 └─ webhookReceiver() → WebhookReceiver    (no network — parses incoming payloads)
```

### Webhooks

```typescript
await client.webhooks.list();
// => Webhook[]

await client.webhooks.create({
  alloNumber: "+1234567890",
  url: "https://example.com/hook",
  topics: [WebhookTopic.CALL_RECEIVED],
  enabled: true,
});
// => Webhook

await client.webhooks.delete("web-2NfDKEm9sF8xK3pQr1Zt");
```

### Calls

```typescript
const page = await client.calls.search({
  alloNumber: "+1234567890",   // requis
  contactNumber: "+0987654321", // optionnel
  page: 0,                     // défaut 0 (0-indexed)
  size: 10,                    // défaut 10, max 100
});
// => { results: Call[]; metadata: { pagination?: { total_pages, current_page } } }
```

### Contacts

```typescript
await client.contacts.get("cnt_abc123");
await client.contacts.search(0, 20);
await client.contacts.searchConversation("cnt_abc123", 0, 20);

await client.contacts.create({
  numbers: ["+15551234567"],
  name: "John",
  lastName: "Doe",
  emails: ["john@acme.com"],
});

await client.contacts.update("cnt_abc123", {
  last_name: "Smith",
  job_title: "CTO",
  emails: ["john@acme.com", "j.smith@acme.com"],
});
```

### SMS

```typescript
// US / International — envoi depuis un numéro Allo
await client.sms.send({
  from: "+1234567890",
  to: "+0987654321",
  message: "Hello",
});

// France — Sender ID vérifié requis (alphanumeric 3–11 chars OR short code)
await client.sms.sendFrance({
  senderId: "MyCompany",
  to: "+33612345678",
  message: "Bonjour",
});
```

### Phone Numbers

```typescript
const numbers = await client.phoneNumbers.list();
// => PhoneNumber[]
```

---

## WebhookReceiver — réception des événements

Parse les payloads entrants et dispatch vers les handlers.

```typescript
import { WebhookReceiver, WebhookTopic } from "@qrcommunication/withallo-sdk";

const receiver = new WebhookReceiver();

receiver
  .on(WebhookTopic.CALL_RECEIVED, async (event) => {
    const id = event.get<string>("id");
    const summary = event.get<string>("one_sentence_summary");
    // ... votre logique
  })
  .on(WebhookTopic.SMS_RECEIVED, async (event) => {
    const content = event.get<string>("content");
    const direction = event.get<"INBOUND" | "OUTBOUND">("direction");
  });

// Exemple: Next.js App Router Route Handler
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  try {
    await receiver.handle(rawBody);
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 400 });
  }
}

// Exemple: Express
app.post("/webhooks/allo", async (req, res) => {
  const rawBody = JSON.stringify(req.body);
  await receiver.handle(rawBody);
  res.status(200).end();
});
```

`WebhookEvent` expose :
- `.topic` — `WebhookTopic`
- `.data` — payload typé (`TData` générique)
- `.raw` — enveloppe JSON complète
- `.isCall() / isSms() / isContactCreated() / isContactUpdated()`
- `.get<T>(path, fallback?)` — accès dot-notation

---

## Gestion d'erreurs / Error handling

```
WithalloError
├── ApiError (httpStatus, responseBody, getErrorCode(), getDetails())
│   ├── AuthenticationError  → 401 (API_KEY_INVALID)
│   ├── ForbiddenError       → 403 (requiredScopes(): string[])
│   ├── ValidationError      → 400/422 (errors(): Record<string, string>)
│   ├── NotFoundError        → 404
│   └── RateLimitError       → 429 (retryAfterSeconds: number | null)
└── InvalidWebhookPayloadError → payload webhook malformé (parse)
```

```typescript
import { ForbiddenError, RateLimitError } from "@qrcommunication/withallo-sdk";

try {
  await client.webhooks.create({ /* ... */ });
} catch (err) {
  if (err instanceof ForbiddenError) {
    console.error("Scope manquant :", err.requiredScopes());
  } else if (err instanceof RateLimitError) {
    await new Promise((r) => setTimeout(r, (err.retryAfterSeconds ?? 1) * 1000));
    // retry...
  } else {
    throw err;
  }
}
```

---

## Sécurité des webhooks / Webhook security

> **Important** : au moment de la publication de ce SDK (avril 2026), la documentation publique de Withallo **ne spécifie aucun en-tête de signature HMAC** permettant de vérifier cryptographiquement l'origine des webhooks. Ce SDK valide la *forme* du payload mais ne peut pas authentifier l'expéditeur.

**Hardening recommandé** :
- Servez votre endpoint webhook **en HTTPS uniquement**.
- Utilisez une URL **secrète et non devinable** (token dans le path).
- Whitelist des **IPs egress Withallo** au firewall si publiées.
- Rejetez les payloads dont `allo_number` ne fait **pas partie de vos propres numéros**.
- Répondez `200 OK` en **moins de 30 secondes**.

Si Withallo publie un schéma de signature, une méthode `WebhookReceiver.verifySignature(rawBody, signature, secret)` sera ajoutée sans breaking change.

---

## Développement / Development

```bash
pnpm install
pnpm build        # ESM + CJS + .d.ts via tsup
pnpm test         # vitest run
pnpm test:watch   # vitest --watch
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

### Release process

Ce package suit le [Semantic Versioning](https://semver.org/). Les versions sont automatisées par [release-please](https://github.com/googleapis/release-please) :

1. Merger une PR sur `main` avec des commits au format [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, etc.)
2. release-please crée une PR "chore(release): X.Y.Z" avec le changelog auto-généré
3. Merger cette PR tag la release et publie sur npm via le workflow `release.yml`

---

## Licence / License

[MIT](LICENSE) © 2026 [QrCommunication](https://qrcommunication.com)

---

## Liens / Links

- [Documentation API Withallo (EN)](https://help.withallo.com/en/api-reference/introduction)
- [Documentation API Withallo (FR)](https://help.withallo.com/fr/api-reference/introduction)
- [SDK PHP](https://github.com/QrCommunication/sdk-withallo-php)
- [npm package](https://www.npmjs.com/package/@qrcommunication/withallo-sdk)
