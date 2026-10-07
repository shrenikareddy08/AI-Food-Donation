import { useState, useEffect, useRef, useCallback } from 'react';
import { trackingService } from '../services/trackingService';

/**
 * useLiveLocation — subscribes to live volunteer location updates.
 * Uses mock tracking by default; real mode can be activated via source param.
 */
export function useLiveLocation(pickup, destination, options = {}) {
  const { intervalMs = 2000, source = 'mock' } = options;
  const [position, setPosition] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('IDLE');
  const [lastUpdated, setLastUpdated] = useState(null);
  const cancelRef = useRef(null);

  const start = useCallback(() => {
    if (cancelRef.current) cancelRef.current();

    if (source === 'mock' || trackingService.isMockMode) {
      cancelRef.current = trackingService.startMockTracking(
        pickup,
        destination,
        (data) => {
          setPosition({ latitude: data.latitude, longitude: data.longitude });
          setProgress(data.progress || 0);
          setStatus(data.status || 'IN_TRANSIT');
          setLastUpdated(new Date());
        },
        intervalMs
      );
    }
  }, [pickup, destination, intervalMs, source]);

  const stop = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { position, progress, status, lastUpdated, start, stop };
}
