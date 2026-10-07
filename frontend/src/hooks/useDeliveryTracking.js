import { useState, useCallback, useRef } from 'react';
import { trackingService } from '../services/trackingService';

/**
 * useDeliveryTracking — higher-level tracking hook for a full delivery lifecycle.
 * Combines route data, ETA calculation, and live position updates.
 */
export function useDeliveryTracking(delivery, options = {}) {
  const { source = 'mock', intervalMs = 2000 } = options;
  const [position, setPosition] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(delivery?.status || 'IDLE');
  const [eta, setEta] = useState(delivery?.etaMinutes || null);
  const [distanceRemaining, setDistanceRemaining] = useState(delivery?.distanceKm || null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const cancelRef = useRef(null);

  const start = useCallback(() => {
    if (!delivery?.pickup || !delivery?.destination) return;
    if (cancelRef.current) cancelRef.current();

    cancelRef.current = trackingService.startMockTracking(
      delivery.pickup,
      delivery.destination,
      (data) => {
        setPosition({ latitude: data.latitude, longitude: data.longitude });
        setProgress(data.progress || 0);
        setStatus(data.status || 'IN_TRANSIT');
        setLastUpdated(new Date());

        const remaining = delivery.distanceKm
          ? Math.max(0, delivery.distanceKm * (1 - (data.progress || 0) / 100))
          : null;
        setDistanceRemaining(remaining !== null ? +remaining.toFixed(1) : null);

        const remainingEta = delivery.etaMinutes
          ? Math.max(0, Math.round(delivery.etaMinutes * (1 - (data.progress || 0) / 100)))
          : null;
        setEta(remainingEta);
      },
      intervalMs
    );
  }, [delivery, intervalMs, source]);

  const stop = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
  }, []);

  return { position, progress, status, eta, distanceRemaining, lastUpdated, start, stop };
}
