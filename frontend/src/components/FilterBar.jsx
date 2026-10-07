import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export default function FilterBar({ filters, activeFilters, onChange, sortOptions, activeSort, onSortChange, className }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('filter-bar', className)}>
      <div className="filter-bar__row">
        <div className="filter-bar__chips">
          {filters.map((filter) => {
            const isActive = activeFilters[filter.id] !== undefined && activeFilters[filter.id] !== '';
            return (
              <button
                key={filter.id}
                className={cn('filter-chip', isActive && 'filter-chip--active')}
                onClick={() => {
                  if (filter.type === 'toggle') {
                    onChange(filter.id, isActive ? '' : filter.value);
                  }
                }}
              >
                {filter.icon && <filter.icon size={14} />}
                {filter.label}
              </button>
            );
          })}
        </div>

        {sortOptions && sortOptions.length > 0 && (
          <div className="filter-bar__sort">
            <span className="filter-bar__sort-label">Sort:</span>
            <div className="filter-bar__sort-select">
              <select
                value={activeSort}
                onChange={(e) => onSortChange?.(e.target.value)}
                aria-label="Sort results"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
