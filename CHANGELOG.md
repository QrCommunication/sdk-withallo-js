# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/QrCommunication/sdk-withallo-js/releases/tag/v0.1.0
