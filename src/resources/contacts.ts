import type { HttpClient } from "../http.js";
import type {
  Contact,
  ConversationEntry,
  CreateContactInput,
  UpdateContactFields,
} from "../types/contact.js";
import type { EnvelopedResponse, Paginated } from "../types/common.js";

/**
 * Contacts resource.
 *
 * Required scopes: `CONTACTS_READ` for get/search, `CONTACTS_READ_WRITE` for create/update.
 *
 * NB: the GET endpoint uses the singular path `/contact/{id}`, while POST/PUT/LIST use
 * the plural `/contacts`. That is Withallo's convention.
 */
export class ContactsResource {
  constructor(private readonly http: HttpClient) {}

  async get(contactId: string): Promise<Contact> {
    const response = await this.http.get<EnvelopedResponse<Contact>>(
      `/contact/${encodeURIComponent(contactId)}`,
    );
    return response.data;
  }

  async search(page = 0, size = 10): Promise<Paginated<Contact>> {
    const response = await this.http.get<EnvelopedResponse<Paginated<Contact>>>(
      "/contacts",
      {
        query: { page, size },
      },
    );
    return response.data;
  }

  async searchConversation(
    contactId: string,
    page = 0,
    size = 10,
  ): Promise<Paginated<ConversationEntry>> {
    const response = await this.http.get<
      EnvelopedResponse<Paginated<ConversationEntry>>
    >(`/contact/${encodeURIComponent(contactId)}/conversation`, {
      query: { page, size },
    });
    return response.data;
  }

  async create(input: CreateContactInput): Promise<Contact> {
    const body: Record<string, unknown> = { numbers: input.numbers };
    if (input.name !== undefined) body.name = input.name;
    if (input.lastName !== undefined) body.last_name = input.lastName;
    if (input.jobTitle !== undefined) body.job_title = input.jobTitle;
    if (input.website !== undefined) body.website = input.website;
    if (input.emails !== undefined) body.emails = input.emails;
    if (input.company !== undefined) body.company = input.company;

    const response = await this.http.post<EnvelopedResponse<Contact>>(
      "/contacts",
      body,
    );
    return response.data;
  }

  async update(
    contactId: string,
    fields: UpdateContactFields,
  ): Promise<Contact> {
    const response = await this.http.put<EnvelopedResponse<Contact>>(
      `/contacts/${encodeURIComponent(contactId)}`,
      fields,
    );
    return response.data;
  }
}
