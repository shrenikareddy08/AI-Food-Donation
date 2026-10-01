import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';

export default function SearchBar({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search food, NGO, location...',
  showFilters = false,
  onToggleFilters,
  className,
  autoFocus = false,
}) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(localValue);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange?.(val);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  return (
    <form className={cn('search-bar', className)} onSubmit={handleSubmit} role="search">
      <div className="search-bar__input-wrap">
        <Search size={18} className="search-bar__icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          aria-label="Search"
        />
        {localValue && (
          <button type="button" className="search-bar__clear" onClick={handleClear} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>
      {showFilters && (
        <button
          type="button"
          className="search-bar__filter-btn"
          onClick={onToggleFilters}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={18} />
        </button>
      )}
    </form>
  );
}
