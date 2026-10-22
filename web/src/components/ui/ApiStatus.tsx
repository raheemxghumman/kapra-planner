import { getHealth } from '../../api/health.api';
import { useApi } from '../../hooks/useApi';

/** Small badge that shows whether the backend (and its database) is reachable. */
export function ApiStatus() {
  const { data, error, loading } = useApi((signal) => getHealth(signal));

  const state = loading ? 'checking' : data ? 'online' : 'offline';
  const dotColour = {
    checking: 'bg-stone animate-pulse',
    online: 'bg-olive',
    offline: 'bg-red-700',
  }[state];

  return (
    <span
      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted"
      title={error ?? (data ? `Database ${data.database}` : undefined)}
      role="status"
    >
      <span className={`h-2 w-2 rounded-full ${dotColour}`} />
      API {state}
    </span>
  );
}
