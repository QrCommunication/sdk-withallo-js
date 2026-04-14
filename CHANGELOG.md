# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-14

### Security

- Bumped dev dependencies to close 8 Dependabot alerts (all dev-scoped, not shipped in the npm tarball):
  - `vitest` 2.1 → 3.2 (pulls in patched `vite` 6.x for CVE on dev-server optimized deps)
  - `@vitest/coverage-v8` 2.1 → 3.2
  - `happy-dom` 15 → 20.9 (fixes critical VM context escape RCE, high fetch credentials leak, high unsanitized export names)

### Documentation

- Added [`docs/openapi.yaml`](docs/openapi.yaml): full OpenAPI 3.1 specification
  of the Withallo REST API and webhook payloads (every endpoint, schema, error
  shape, and security scheme documented).
- Added [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) with mermaid diagrams:
  high-level layers, outbound request lifecycle, error flow, incoming webhook
  pipeline, module boundaries, type architecture, extension points, bundling,
  testing, and security model.
- Added [`docs/examples/`](docs/examples/):
  - `nextjs-webhook-route.ts` — Next.js App Router Route Handler for webhooks
  - `express-server.ts` — Express server with outbound SMS + webhook receiver
  - `react-dashboard.tsx` — Full React admin dashboard using SDK hooks
  - `error-handling.ts` — Exhaustive error handling with retry / scope / validation
  - `live-smoke-test.ts` — End-to-end smoke test against the real API
- Added [`llms.txt`](llms.txt) at [llmstxt.org](https://llmstxt.org) format so
  LLMs and AI agents can locate the SDK's documentation, source map, and
  related packages in one file.
- Linked all new docs from the `README.md` "Documentation & examples" table.

### CI/CD

- Replaced the `release-please` workflow with a tag-based release pipeline
  aligned to the `QrCommunication/scell-sdk-js` pattern:
  - Trigger on `push` of tag `v*`
  - Jobs: `build` → `publish` (npm via OIDC Trusted Publishing, no `NPM_TOKEN`) → `github-release` (notes from CHANGELOG)
- Removed `release-please-config.json` and `.release-please-manifest.json`.

## [0.1.0] - 2026-04-14

### Features

- Initial release: TypeScript SDK covering the Withallo (Allo) public API
  - Isomorphic `WithalloClient` (Node 18+, browser, Deno, React Native, edge)
    with raw-API-key auth (no `Bearer` prefix)
  - Resources: `WebhooksResource`, `CallsResource`, `ContactsResource`,
    `SmsResource`, `PhoneNumbersResource`
  - `WebhookReceiver` for parsing and dispatching incoming webhook payloads
    (topics: `CALL_RECEIVED`, `SMS_RECEIVED`, `CONTACT_CREATED`, `CONTACT_UPDATED`)
  - Typed error hierarchy (`AuthenticationError`, `ForbiddenError`,
    `ValidationError`, `NotFoundError`, `RateLimitError`,
    `InvalidWebhookPayloadError`)
  - Backed enums (`as const`) for `Environment`, `Scope`, `WebhookTopic`,
    `CallResult`, `CallType`, `SmsType`, `SmsDirection`
  - Fully typed resource inputs/outputs
  - `fetch`-based HTTP client (no runtime dependency)
  - Dual package: ESM + CJS with declaration files
- React helpers under `@qrcommunication/withallo-sdk/react`:
  - `WithalloProvider`, `useWithallo`
  - `useSendSms`, `useSendSmsFrance` (mutations)
  - `useWebhooks` (auto-fetching query), `useCreateWebhook`, `useDeleteWebhook`
  - `useAsyncAction` (low-level wrapper)
- Vitest + happy-dom test suite (35 tests)

### Documentation

- Bilingual (FR/EN) README with quick start, React usage, resource reference,
  error handling, and webhook security guidance
- `CLAUDE.md` / `AGENTS.md` AI-agent instructions
- `skill/SKILL.md` Claude Code skill descriptor

[0.2.0]: https://github.com/QrCommunication/sdk-withallo-js/releases/tag/v0.2.0
[0.1.0]: https://github.com/QrCommunication/sdk-withallo-js/releases/tag/v0.1.0
