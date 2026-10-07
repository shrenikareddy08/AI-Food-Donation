import { useState, useCallback } from 'react';

/**
 * useCurrentLocation — requests browser geolocation permission
 * and provides the current coordinates.
 */
export function useCurrentLocation() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt');

  const request = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by this browser.');
        setError(err.message);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);
      setPermission('requesting');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCoords({ latitude, longitude, accuracy });
          setPermission('granted');
          setLoading(false);
          resolve({ latitude, longitude, accuracy });
        },
        (err) => {
          let message = err.message || 'Unable to retrieve location.';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location permission denied. Please enable location access or select manually.';
            setPermission('denied');
          }
          setError(message);
          setLoading(false);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return { coords, loading, error, permission, request };
}
