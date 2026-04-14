import type { HttpClient } from "../http.js";
import type {
  SendSmsFranceInput,
  SendSmsInput,
  SentSms,
} from "../types/sms.js";
import type { EnvelopedResponse } from "../types/common.js";

/**
 * SMS resource — send outbound SMS/MMS.
 *
 * Required scope: `SMS_SEND`.
 */
export class SmsResource {
  constructor(private readonly http: HttpClient) {}

  /** Send an SMS from one of your Allo numbers (US / international). */
  async send(input: SendSmsInput): Promise<SentSms> {
    const response = await this.http.post<EnvelopedResponse<SentSms>>("/sms", {
      from: input.from,
      to: input.to,
      message: input.message,
    });
    return response.data;
  }

  /**
   * Send an SMS to a French recipient using a verified Sender ID.
   * The Sender ID (alphanumeric 3–11 chars, or short code) must be
   * pre-verified by Allo support.
   */
  async sendFrance(input: SendSmsFranceInput): Promise<SentSms> {
    const response = await this.http.post<EnvelopedResponse<SentSms>>("/sms", {
      sender_id: input.senderId,
      to: input.to,
      message: input.message,
    });
    return response.data;
  }
}
