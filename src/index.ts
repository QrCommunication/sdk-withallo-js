// Core
export { WithalloClient, type WithalloClientOptions } from "./client.js";
export { WithalloConfig, type WithalloConfigOptions } from "./config.js";
export { HttpClient, type HttpRequestOptions } from "./http.js";

// Resources
export { WebhooksResource } from "./resources/webhooks.js";
export { CallsResource } from "./resources/calls.js";
export { ContactsResource } from "./resources/contacts.js";
export { SmsResource } from "./resources/sms.js";
export { PhoneNumbersResource } from "./resources/phone-numbers.js";

// Webhook receiver
export { WebhookReceiver, type WebhookHandler } from "./webhook/receiver.js";
export { WebhookEvent } from "./webhook/event.js";

// Enums
export {
  Environment,
  Scope,
  WebhookTopic,
  WEBHOOK_TOPICS,
  CallResult,
  CallType,
  SmsType,
  SmsDirection,
} from "./enums.js";

// Errors
export {
  WithalloError,
  ApiError,
  AuthenticationError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  InvalidWebhookPayloadError,
  type WithalloErrorBody,
  type WithalloErrorDetail,
} from "./errors.js";

// Types
export type * from "./types/index.js";
