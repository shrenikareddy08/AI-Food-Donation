import { MapPin, Crosshair, MapPinned, AlertCircle } from 'lucide-react';

export function LocationPermissionPrompt({ onUseLocation, onManualSelect, loading }) {
  return (
    <div className="location-perm location-perm--prompt">
      <div className="location-perm__icon"><MapPin size={32} /></div>
      <h3 className="location-perm__title">Use your location</h3>
      <p className="location-perm__desc">
        Use your location to discover food and NGOs near you. We prioritize nearby results to connect you faster.
      </p>
      <div className="location-perm__actions">
        <button className="location-perm__btn location-perm__btn--primary" onClick={onUseLocation} disabled={loading}>
          <Crosshair size={18} /> {loading ? 'Detecting...' : 'Use My Location'}
        </button>
        <button className="location-perm__btn location-perm__btn--secondary" onClick={onManualSelect}>
          <MapPinned size={18} /> Choose Location Manually
        </button>
      </div>
    </div>
  );
}

export function LocationDenied({ onRetry, onManualSelect }) {
  return (
    <div className="location-perm location-perm--denied">
      <div className="location-perm__icon location-perm__icon--warning"><AlertCircle size={32} /></div>
      <h3 className="location-perm__title">Location access is turned off</h3>
      <p className="location-perm__desc">
        Enabling location helps us show nearby food donations and NGOs closest to you. You can still select your location manually.
      </p>
      <div className="location-perm__actions">
        <button className="location-perm__btn location-perm__btn--primary" onClick={onRetry}>
          <Crosshair size={18} /> Enable Location
        </button>
        <button className="location-perm__btn location-perm__btn--secondary" onClick={onManualSelect}>
          <MapPinned size={18} /> Choose Location Manually
        </button>
      </div>
    </div>
  );
}

export function LocationError({ onRetry, onManualSelect }) {
  return (
    <div className="location-perm location-perm--error">
      <div className="location-perm__icon location-perm__icon--error"><AlertCircle size={32} /></div>
      <h3 className="location-perm__title">Unable to detect your location</h3>
      <p className="location-perm__desc">
        We couldn't access your device location. Please try again or pick your location manually.
      </p>
      <div className="location-perm__actions">
        <button className="location-perm__btn location-perm__btn--primary" onClick={onRetry}>
          <Crosshair size={18} /> Try Again
        </button>
        <button className="location-perm__btn location-perm__btn--secondary" onClick={onManualSelect}>
          <MapPinned size={18} /> Choose Location Manually
        </button>
      </div>
    </div>
  );
}
