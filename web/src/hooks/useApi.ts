import { isCancel } from 'axios';
import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { getErrorMessage } from '../utils/errors';

interface ApiState<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
}

/**
 * Loads data when the component mounts (and when `deps` change) and exposes
 * { data, error, loading, reload }. If the component unmounts or the deps change
 * before the request finishes, the old request is aborted so it cannot overwrite newer data.
 */
export function useApi<T>(
  request: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList = [],
): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: undefined }));

    request(controller.signal)
      .then((data) => setState({ data, error: undefined, loading: false }))
      .catch((error: unknown) => {
        if (isCancel(error)) return;
        setState({ data: undefined, error: getErrorMessage(error), loading: false });
      });

    return () => controller.abort();
    // `request` is usually an inline arrow function; callers control re-runs through `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { ...state, reload };
}
