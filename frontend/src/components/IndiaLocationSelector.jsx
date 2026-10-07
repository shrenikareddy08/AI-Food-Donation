import { useState } from 'react';
import { MapPin, ChevronRight, Check } from 'lucide-react';
import Modal from './Modal';
import { INDIA_STATES, getCitiesForState, getAreasForCity, getCoordsForArea } from '../utils/indiaLocations';

export default function IndiaLocationSelector({ open, onClose, onSelect }) {
  const [step, setStep] = useState('state');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');

  const handleState = (s) => {
    setState(s);
    setCity('');
    setArea('');
    setStep('city');
  };

  const handleCity = (c) => {
    setCity(c);
    setArea('');
    setStep('area');
  };

  const handleArea = (a) => {
    setArea(a);
  };

  const handleConfirm = () => {
    const coords = getCoordsForArea(state, city, area);
    const label = area
      ? `${area}, ${city}, ${state}`
      : `${city}, ${state}`;
    onSelect({
      label,
      city,
      state,
      area: area || '',
      latitude: coords?.lat ?? 17.385,
      longitude: coords?.lng ?? 78.4867,
      source: 'manual',
    });
    handleClose();
  };

  const handleClose = () => {
    setStep('state');
    setState('');
    setCity('');
    setArea('');
    onClose();
  };

  const renderList = (items, onSelectItem, selectedValue) => (
    <div className="india-selector__list">
      {items.map((item) => (
        <button
          key={item}
          className={`india-selector__item ${selectedValue === item ? 'india-selector__item--selected' : ''}`}
          onClick={() => onSelectItem(item)}
        >
          <span className="india-selector__item-icon"><MapPin size={16} /></span>
          <span className="india-selector__item-label">{item}</span>
          {selectedValue === item
            ? <Check size={16} className="india-selector__check" />
            : <ChevronRight size={16} className="india-selector__chevron" />}
        </button>
      ))}
    </div>
  );

  const breadcrumbs = [
    { label: 'India', step: 'state' },
    state && { label: state, step: 'city' },
    city && { label: city, step: 'area' },
  ].filter(Boolean);

  return (
    <Modal open={open} onClose={handleClose} title="Select Location in India" size="md">
      <div className="india-selector">
        <div className="india-selector__breadcrumb">
          {breadcrumbs.map((bc, i) => (
            <button
              key={i}
              className="india-selector__crumb"
              onClick={() => setStep(bc.step)}
            >
              {bc.label}
            </button>
          ))}
        </div>

        {step === 'state' && renderList(INDIA_STATES, handleState, state)}

        {step === 'city' && renderList(getCitiesForState(state), handleCity, city)}

        {step === 'area' && (
          <>
            {renderList(['All Areas', ...getAreasForCity(state, city)], handleArea, area)}
            {area && (
              <button className="india-selector__confirm" onClick={handleConfirm}>
                <Check size={18} /> Confirm Location
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
