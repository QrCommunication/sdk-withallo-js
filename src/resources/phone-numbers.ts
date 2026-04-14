import type { HttpClient } from "../http.js";
import type { PhoneNumber } from "../types/phone-number.js";
import type { EnvelopedResponse } from "../types/common.js";

/**
 * PhoneNumbers resource — list the numbers connected to your account.
 *
 * Required scope: `CONVERSATIONS_READ`.
 */
export class PhoneNumbersResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<PhoneNumber[]> {
    const response =
      await this.http.get<EnvelopedResponse<PhoneNumber[]>>("/numbers");
    return Array.isArray(response?.data) ? response.data : [];
  }
}
