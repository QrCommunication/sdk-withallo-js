/**
 * Withallo API environment. Only `production` is publicly documented.
 */
export const Environment = {
  PRODUCTION: "production",
} as const;
export type Environment = (typeof Environment)[keyof typeof Environment];

/**
 * API key scopes.
 *
 * A 403 response with `API_KEY_INSUFFICIENT_SCOPE` is returned when a scope is missing.
 */
export const Scope = {
  WEBHOOKS_READ_WRITE: "WEBHOOKS_READ_WRITE",
  CONVERSATIONS_READ: "CONVERSATIONS_READ",
  CONTACTS_READ: "CONTACTS_READ",
  CONTACTS_READ_WRITE: "CONTACTS_READ_WRITE",
  SMS_SEND: "SMS_SEND",
} as const;
export type Scope = (typeof Scope)[keyof typeof Scope];

/**
 * Webhook topics emitted by Withallo, sent in the `topic` field.
 */
export const WebhookTopic = {
  CALL_RECEIVED: "CALL_RECEIVED",
  SMS_RECEIVED: "SMS_RECEIVED",
  CONTACT_CREATED: "CONTACT_CREATED",
  CONTACT_UPDATED: "CONTACT_UPDATED",
} as const;
export type WebhookTopic = (typeof WebhookTopic)[keyof typeof WebhookTopic];

export const WEBHOOK_TOPICS: readonly WebhookTopic[] =
  Object.values(WebhookTopic);

export const CallResult = {
  ANSWERED: "ANSWERED",
  VOICEMAIL: "VOICEMAIL",
  TRANSFERRED_AI: "TRANSFERRED_AI",
  TRANSFERRED_EXTERNAL: "TRANSFERRED_EXTERNAL",
  BLOCKED: "BLOCKED",
  FAILED: "FAILED",
} as const;
export type CallResult = (typeof CallResult)[keyof typeof CallResult];

export const CallType = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND",
} as const;
export type CallType = (typeof CallType)[keyof typeof CallType];

export const SmsType = {
  SMS: "SMS",
  MMS: "MMS",
} as const;
export type SmsType = (typeof SmsType)[keyof typeof SmsType];

export const SmsDirection = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND",
} as const;
export type SmsDirection = (typeof SmsDirection)[keyof typeof SmsDirection];
