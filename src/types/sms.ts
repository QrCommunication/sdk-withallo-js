export interface SentSms {
  from_number: string | null;
  sender_id: string | null;
  to_number: string;
  type: string;
  content: string;
  start_date: string;
}

export interface SendSmsInput {
  from: string;
  to: string;
  message: string;
}

export interface SendSmsFranceInput {
  senderId: string;
  to: string;
  message: string;
}
