import { useState, useRef, useEffect } from 'react';
import { MapPin, Crosshair, ChevronDown, Check } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import { cn } from '../utils/cn';
import { INDIA_STATES, getCitiesForState, getAreasForCity, getCoordsForArea } from '../utils/indiaLocations';
import IndiaLocationSelector from './IndiaLocationSelector';

export default function LocationHeader({ compact = false, className }) {
  const { location, detectLocation, setManualLocation, locating } = useLocationContext();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('main');
  const [selectedState, setSelectedState] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setStep('main');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDetect = async () => {
    try {
      await detectLocation();
      setOpen(false);
    } catch {
      // error handled by context
    }
  };

  const handleSelectArea = (state, city, area) => {
    const coords = getCoordsForArea(state, city, area);
    setManualLocation({
      label: area ? `${area}, ${city}, ${state}` : `${city}, ${state}`,
      city,
      state,
      area: area || '',
      latitude: coords?.lat,
      longitude: coords?.lng,
    });
    setOpen(false);
    setStep('main');
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setStep('city');
  };

  const handleCitySelect = (city) => {
    const areas = getAreasForCity(selectedState, city);
    if (areas.length > 0) {
      setStep('area');
      const cityData = { city, areas };
      sessionStorage.setItem('mb_city_select', JSON.stringify({ state: selectedState, ...cityData }));
    } else {
      handleSelectArea(selectedState, city, '');
    }
  };

  const [currentCity, setCurrentCity] = useState('');
  const cityAreas = currentCity ? getAreasForCity(selectedState, currentCity) : [];

  return (
    <div className={cn('location-header', compact && 'location-header--compact', className)} ref={ref}>
      <button
        className="location-header__button"
        onClick={() => setOpen(!open)}
        aria-label="Change location"
        aria-expanded={open}
      >
        <MapPin size={compact ? 14 : 16} className="location-header__pin" />
        <span className="location-header__label">{location.label}</span>
        <ChevronDown size={14} className={cn('location-header__chevron', open && 'location-header__chevron--open')} />
      </button>

      {open && (
        <div className="location-header__dropdown animate-scale-in">
          {step === 'main' && (
            <>
              <button className="location-header__action" onClick={handleDetect} disabled={locating}>
                <Crosshair size={18} className={cn(locating && 'animate-spin')} />
                <span>{locating ? 'Detecting location...' : 'Use current location'}</span>
              </button>
              <div className="location-header__divider" />
              <div className="location-header__section-label">Select manually (India only)</div>
              <div className="location-header__list">
                {INDIA_STATES.map((state) => (
                  <button
                    key={state}
                    className="location-header__item"
                    onClick={() => handleStateSelect(state)}
                  >
                    <span>{state}</span>
                    <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'city' && (
            <>
              <button className="location-header__back" onClick={() => setStep('main')}>
                ← Back to states
              </button>
              <div className="location-header__section-label">
                {selectedState} — Select city
              </div>
              <div className="location-header__list">
                {getCitiesForState(selectedState).map((city) => (
                  <button
                    key={city}
                    className="location-header__item"
                    onClick={() => {
                      setCurrentCity(city);
                      handleCitySelect(city);
                    }}
                  >
                    <span>{city}</span>
                    {location.city === city && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'area' && (
            <>
              <button className="location-header__back" onClick={() => setStep('city')}>
                ← Back to cities
              </button>
              <div className="location-header__section-label">
                {currentCity}, {selectedState} — Select area
              </div>
              <div className="location-header__list">
                <button
                  className="location-header__item"
                  onClick={() => handleSelectArea(selectedState, currentCity, '')}
                >
                  <span>All Areas</span>
                </button>
                {cityAreas.map((area) => (
                  <button
                    key={area}
                    className="location-header__item"
                    onClick={() => handleSelectArea(selectedState, currentCity, area)}
                  >
                    <span>{area}</span>
                    {location.area === area && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <IndiaLocationSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(loc) => setManualLocation(loc)}
      />
    </div>
  );
}
