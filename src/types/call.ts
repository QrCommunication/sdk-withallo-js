import type { CallType } from "../enums.js";

export interface Call {
  id: string;
  from_number: string;
  to_number: string;
  length_in_minutes: number;
  type: CallType;
  summary: string | null;
  tag: string | null;
  recording_url: string | null;
  start_date: string;
  transcript?: ReadonlyArray<{
    source: string;
    text: string;
    time: string;
    start_seconds?: number;
    end_seconds?: number;
  }>;
}

export interface SearchCallsInput {
  alloNumber: string;
  contactNumber?: string;
  page?: number;
  size?: number;
}
