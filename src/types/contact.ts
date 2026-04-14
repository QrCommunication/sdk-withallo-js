export interface Contact {
  id: string;
  name: string | null;
  last_name: string | null;
  job_title: string | null;
  website: string | null;
  status: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  numbers: string[];
  emails?: string[];
  company?: { id: string; name: string } | null;
  is_whitelisted?: boolean;
  last_activity_date?: string | null;
  engagement?: string | null;
  integration_data?: Record<string, unknown> | null;
  custom_properties?: Record<string, unknown> | null;
  activity?: ReadonlyArray<ContactActivity>;
  conversation_url?: string;
}

export interface ContactActivity {
  type: string;
  made_by: string;
  made_at: string;
  allo_number: string | null;
  content: string | null;
}

export interface CreateContactInput {
  numbers: string[];
  name?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  website?: string | null;
  emails?: string[] | null;
  company?: string | null;
}

export interface UpdateContactFields {
  name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  website?: string | null;
  emails?: string[] | null;
  numbers?: string[] | null;
}

export interface ConversationEntry {
  type: "CALL" | "TEXT_MESSAGE" | string;
  call: null | {
    id: string;
    from_number: string;
    to_number: string;
    length_in_minutes: number;
    type: string;
    summary: string | null;
    tag: string | null;
    tags?: string[];
    recording_url: string | null;
    start_date: string;
    transcript?: ReadonlyArray<{
      source: string;
      text: string;
      time: string;
      start_seconds?: number;
      end_seconds?: number;
    }>;
  };
  message: null | {
    from_number: string;
    to_number: string;
    type: string;
    content: string;
    start_date: string;
  };
}
