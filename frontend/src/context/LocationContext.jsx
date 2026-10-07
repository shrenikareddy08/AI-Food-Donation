import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LocationContext = createContext(null);

const STORAGE_KEY = 'mealbridge_location';

const DEFAULT_LOCATION = {
  label: 'Hyderabad, Telangana',
  city: 'Hyderabad',
  state: 'Telangana',
  area: '',
  latitude: 17.385,
  longitude: 78.4867,
  source: 'default',
};

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [permissionState, setPermissionState] = useState('prompt');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLocation(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((loc) => {
    setLocation(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
  }, []);

  const detectLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }
      setLocating(true);
      setPermissionState('requesting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const loc = {
            label: 'Current Location',
            city: 'Hyderabad',
            state: 'Telangana',
            area: '',
            latitude,
            longitude,
            source: 'gps',
          };
          persist(loc);
          setPermissionState('granted');
          setLocating(false);
          resolve(loc);
        },
        (err) => {
          setLocating(false);
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionState('denied');
          }
          reject(new Error(err.message || 'Unable to retrieve location.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [persist]);

  const setManualLocation = useCallback((loc) => {
    const full = {
      ...loc,
      source: 'manual',
      latitude: loc.latitude ?? DEFAULT_LOCATION.latitude,
      longitude: loc.longitude ?? DEFAULT_LOCATION.longitude,
    };
    persist(full);
    setPermissionState('manual');
  }, [persist]);

  const value = {
    location,
    permissionState,
    locating,
    detectLocation,
    setManualLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}
