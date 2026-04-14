import type { HttpClient } from "../http.js";
import type { Call, SearchCallsInput } from "../types/call.js";
import type { EnvelopedResponse, Paginated } from "../types/common.js";

/**
 * Calls resource — search call history.
 *
 * Required scope: `CONVERSATIONS_READ`.
 */
export class CallsResource {
  constructor(private readonly http: HttpClient) {}

  async search(input: SearchCallsInput): Promise<Paginated<Call>> {
    const response = await this.http.get<EnvelopedResponse<Paginated<Call>>>(
      "/calls",
      {
        query: {
          allo_number: input.alloNumber,
          contact_number: input.contactNumber,
          page: input.page ?? 0,
          size: input.size ?? 10,
        },
      },
    );
    return response.data;
  }
}
