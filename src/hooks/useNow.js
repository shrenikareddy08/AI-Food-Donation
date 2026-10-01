import { useState, useEffect } from 'react';

/**
 * useNow — returns a Date that updates at a given interval.
 * Useful for displaying current time on dashboards and tracking screens.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
