import React, { useState } from 'react';
import { Search, Sparkles, Filter, MapPin, Tag } from 'lucide-react';

export default function SemanticSearchBar({ onSearch, loading = false, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [entityType, setEntityType] = useState('ALL');

  const exampleChips = [
    'food suitable for children',
    'vegetarian food for 50 people',
    'food expiring today',
    'high quantity food near NGOs',
    'birthday event food donation',
    'urgent food requirement'
  ];

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), entityType);
  };

  const handleChipClick = (chip) => {
    setQuery(chip);
    onSearch(chip, entityType);
  };

  const handleTypeChange = (type) => {
    setEntityType(type);
    if (query.trim()) {
      onSearch(query.trim(), type);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={20} style={{ position: 'absolute', left: '14px', color: '#16a34a' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try natural language: 'vegetarian food for 50 people near NGOs' or 'food expiring today'..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#16a34a'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
            opacity: loading || !query.trim() ? 0.7 : 1
          }}
        >
          <Sparkles size={18} />
          {loading ? 'Searching...' : 'Find Matches'}
        </button>
      </form>

      {/* Filter and Example Chips */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Entity Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Category:
          </span>
          {[
            { id: 'ALL', label: 'All Resources' },
            { id: 'DONATION', label: 'Surplus Food' },
            { id: 'NGO', label: 'Verified NGOs' },
            { id: 'EVENT', label: 'Event Leftovers' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTypeChange(item.id)}
              style={{
                fontSize: '12px',
                fontWeight: entityType === item.id ? '700' : '500',
                backgroundColor: entityType === item.id ? '#16a34a' : '#f1f5f9',
                color: entityType === item.id ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Suggested Queries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={14} /> Examples:
          </span>
          {exampleChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              style={{
                fontSize: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '4px 12px',
                cursor: 'pointer',
                color: '#334155',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0fdf4';
                e.target.style.borderColor = '#86efac';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#e2e8f0';
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
