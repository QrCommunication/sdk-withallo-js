import { useCallback, useRef, useState } from "react";

export interface AsyncActionState<TResult> {
  data: TResult | null;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface AsyncAction<
  TArgs extends unknown[],
  TResult,
> extends AsyncActionState<TResult> {
  run: (...args: TArgs) => Promise<TResult>;
  reset: () => void;
}

/**
 * Internal hook that tracks `isPending / data / error` for a single async action.
 *
 * Guarantees:
 * - handles component unmount (does not call setState on a dead component)
 * - only the latest invocation wins (older concurrent runs are discarded)
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): AsyncAction<TArgs, TResult> {
  const [state, setState] = useState<AsyncActionState<TResult>>({
    data: null,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  const latestRunId = useRef(0);
  const mountedRef = useRef(true);

  const safeSetState: typeof setState = (updater) => {
    if (mountedRef.current) setState(updater);
  };

  const reset = useCallback(() => {
    safeSetState({
      data: null,
      error: null,
      isPending: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      const runId = ++latestRunId.current;
      safeSetState((prev) => ({
        ...prev,
        isPending: true,
        isError: false,
        error: null,
      }));

      try {
        const result = await fn(...args);
        if (runId === latestRunId.current) {
          safeSetState({
            data: result,
            error: null,
            isPending: false,
            isSuccess: true,
            isError: false,
          });
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (runId === latestRunId.current) {
          safeSetState({
            data: null,
            error,
            isPending: false,
            isSuccess: false,
            isError: true,
          });
        }
        throw error;
      }
    },
    [fn],
  );

  return { ...state, run, reset };
}
