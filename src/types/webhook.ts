import type {
  WebhookTopic,
  CallType,
  CallResult,
  SmsDirection,
  SmsType,
} from "../enums.js";

/** Webhook configuration as returned by `GET /webhooks` and `POST /webhooks`. */
export interface Webhook {
  id?: string;
  allo_number?: string;
  alloNumber?: string;
  enabled: boolean;
  url: string;
  topics: WebhookTopic[] | string[];
}

export interface CreateWebhookInput {
  alloNumber: string;
  url: string;
  topics: ReadonlyArray<WebhookTopic | string>;
  enabled?: boolean;
}

/** Envelope for every incoming webhook. */
export interface WebhookEnvelope<T = unknown> {
  topic: WebhookTopic | string;
  data: T;
}

export interface CallReceivedPayload {
  id: string;
  start_date: string;
  recording_url: string | null;
  from_number: string;
  from_name: string | null;
  to: string;
  to_name: string | null;
  length_in_minutes: number;
  length: string;
  tag: string | null;
  summary: string | null;
  one_sentence_summary: string | null;
  transcriptions: ReadonlyArray<{
    source: string;
    time: string;
    text: string;
  }>;
  concatenated_transcript: string;
  data_collected: Record<string, unknown>;
  ivr_result: ReadonlyArray<{ dtmf_key: string | null; text_key: string }>;
  type: CallType;
  result: CallResult;
  integration_id: string | null;
  transfer_from: TransferParty | null;
  transfer_to: TransferParty | null;
  transfer_original_call_id: string | null;
  user_email: string;
  original_to_number: string | null;
  original_to_name: string | null;
}

export interface TransferParty {
  number: string | null;
  user_email: string | null;
  user_name: string | null;
}

export interface SmsReceivedPayload {
  id: string;
  direction: SmsDirection;
  type: SmsType;
  content: string;
  sent_at: string;
  from_number: string;
  to_number: string;
  from_name: string | null;
  to_name: string | null;
}

export interface ContactEventPayload {
  id: string;
  name: string | null;
  last_name: string | null;
  company: string | null;
  emails: string[];
  numbers: string[];
}
