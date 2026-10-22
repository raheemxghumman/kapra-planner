import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stopped changing for `delay` ms. Used for search boxes,
 * so typing "lawn" sends one request instead of four.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
