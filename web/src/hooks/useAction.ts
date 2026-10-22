import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors';
import { useToast } from './useToast';

/**
 * Wraps a button's server call: tracks `running` (for spinners and disabling) and shows the
 * error as a toast, so pages do not repeat try/catch blocks. Resolves to undefined on error.
 * The newest `action` is kept in a ref, so it always sees the current props and state.
 */
export function useAction<Args extends unknown[], Result>(action: (...args: Args) => Promise<Result>) {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const latest = useRef(action);
  useEffect(() => {
    latest.current = action;
  });

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      setRunning(true);
      try {
        return await latest.current(...args);
      } catch (error) {
        toast({ title: getErrorMessage(error), tone: 'error' });
        return undefined;
      } finally {
        setRunning(false);
      }
    },
    [toast],
  );

  return { run, running };
}
