import { useMemo } from "react";
import type {
  SendSmsFranceInput,
  SendSmsInput,
  SentSms,
} from "../types/sms.js";
import { useWithallo } from "./context.js";
import { useAsyncAction, type AsyncAction } from "./use-async-action.js";

/** Hook wrapping `client.sms.send()` with pending / success / error state. */
export function useSendSms(): AsyncAction<[SendSmsInput], SentSms> {
  const client = useWithallo();
  const fn = useMemo(
    () => (input: SendSmsInput) => client.sms.send(input),
    [client],
  );
  return useAsyncAction(fn);
}

/** Hook wrapping `client.sms.sendFrance()`. */
export function useSendSmsFrance(): AsyncAction<[SendSmsFranceInput], SentSms> {
  const client = useWithallo();
  const fn = useMemo(
    () => (input: SendSmsFranceInput) => client.sms.sendFrance(input),
    [client],
  );
  return useAsyncAction(fn);
}
