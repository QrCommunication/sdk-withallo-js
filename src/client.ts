import { WithalloConfig, type WithalloConfigOptions } from "./config.js";
import { HttpClient } from "./http.js";
import { CallsResource } from "./resources/calls.js";
import { ContactsResource } from "./resources/contacts.js";
import { PhoneNumbersResource } from "./resources/phone-numbers.js";
import { SmsResource } from "./resources/sms.js";
import { WebhooksResource } from "./resources/webhooks.js";
import { WebhookReceiver } from "./webhook/receiver.js";

export interface WithalloClientOptions extends WithalloConfigOptions {
  httpClient?: HttpClient;
}

/**
 * Entry point of the SDK.
 *
 *   const client = new WithalloClient({ apiKey: "..." });
 *   await client.sms.send({ from: "+1...", to: "+0...", message: "Hello" });
 */
export class WithalloClient {
  readonly webhooks: WebhooksResource;
  readonly calls: CallsResource;
  readonly contacts: ContactsResource;
  readonly sms: SmsResource;
  readonly phoneNumbers: PhoneNumbersResource;

  private readonly config: WithalloConfig;
  private readonly http: HttpClient;

  constructor(options: WithalloClientOptions) {
    this.config = new WithalloConfig(options);
    this.http = options.httpClient ?? new HttpClient(this.config);

    this.webhooks = new WebhooksResource(this.http);
    this.calls = new CallsResource(this.http);
    this.contacts = new ContactsResource(this.http);
    this.sms = new SmsResource(this.http);
    this.phoneNumbers = new PhoneNumbersResource(this.http);
  }

  getConfig(): WithalloConfig {
    return this.config;
  }

  /**
   * Build a new {@link WebhookReceiver}. Receivers are stateless relative to the
   * HTTP client — create a fresh one per request if you like, or hold a singleton.
   */
  webhookReceiver(): WebhookReceiver {
    return new WebhookReceiver();
  }

  /**
   * Basic connectivity / credentials check. Calls `GET /numbers`
   * (scope `CONVERSATIONS_READ`). Returns `false` on any error.
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.phoneNumbers.list();
      return true;
    } catch {
      return false;
    }
  }
}
