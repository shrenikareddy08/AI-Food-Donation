import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SemanticSearchBar from '../components/SemanticSearchBar';
import { searchService } from '../services/searchService';
import { Sparkles, MapPin, Clock, Package, Building2, Calendar, ArrowRight, CheckCircle } from 'lucide-react';

export default function SemanticSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || 'vegetarian food for 50 people';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [execTime, setExecTime] = useState(0);

  const performSearch = async (q, type = 'ALL') => {
    setLoading(true);
    setSearchedQuery(q);
    setSearchParams({ q, type });

    try {
      const res = await searchService.semanticSearch(q, type);
      setResults(res.results || []);
      setExecTime(res.execution_time_ms || 0);
    } catch (err) {
      console.error('Semantic search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, []);

  const getBadgeStyle = (entityType) => {
    switch (entityType) {
      case 'DONATION':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', label: 'Surplus Food' };
      case 'NGO':
        return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe', label: 'Verified NGO' };
      case 'EVENT':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa', label: 'Event Surplus' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: entityType };
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Sparkles size={16} /> Smart Food Discovery
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '8px 0' }}>
          Find Food & Verified NGO Needs
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
          Find food donations, charity needs, and event leftovers by describing what you need in plain words.
        </p>
      </div>

      {/* Search Bar */}
      <SemanticSearchBar
        initialQuery={queryParam}
        loading={loading}
        onSearch={performSearch}
      />

      {/* Results Meta */}
      {searchedQuery && !loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
          <div>
            Showing <strong>{results.length}</strong> matches for "<em>{searchedQuery}</em>"
          </div>
          <div style={{ fontSize: '12px', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
            Retrieved in {execTime} ms
          </div>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#16a34a' }}>
          <Sparkles size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontWeight: '600', fontSize: '16px' }}>Searching available food & charities...</div>
          <div style={{ color: '#64748b', fontSize: '13px' }}>Matching query against real-time food donations and verified NGOs</div>
        </div>
      ) : results.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          color: '#64748b'
        }}>
          <Package size={44} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h3 style={{ color: '#1e293b', fontSize: '18px', margin: '0 0 8px 0' }}>No Direct Semantic Matches Found</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 16px auto', fontSize: '14px' }}>
            Try broadening your natural language query or selecting a different resource filter above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
          {results.map((item) => {
            const badge = getBadgeStyle(item.entity_type);
            const matchPct = Math.round(item.similarity_score * 100);

            return (
              <div
                key={`${item.entity_type}-${item.id}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '20px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                <div>
                  {/* Card Top: Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {badge.label}
                    </span>

                    <span style={{
                      backgroundColor: matchPct >= 70 ? '#dcfce7' : '#fef9c3',
                      color: matchPct >= 70 ? '#15803d' : '#854d0e',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Sparkles size={11} /> {matchPct}% Match
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
                    {item.title}
                  </h3>

                  {/* Attributes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={14} style={{ color: '#16a34a' }} />
                      <span>{item.quantity_or_capacity} • {item.food_or_requirement}</span>
                    </div>

                    {item.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} style={{ color: '#ef4444' }} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item.location} {item.distance_km ? `(${item.distance_km} km away)` : ''}
                        </span>
                      </div>
                    )}

                    {item.expiry_time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} style={{ color: '#f59e0b' }} />
                        <span>Expires: {new Date(item.expiry_time).toLocaleDateString()} {new Date(item.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Semantic Reasoning Snippet */}
                  {item.relevance_explanation && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      color: '#64748b',
                      borderLeft: '3px solid #16a34a',
                      marginBottom: '16px'
                    }}>
                      {item.relevance_explanation}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    if (item.entity_type === 'DONATION') navigate(`/find-food`);
                    else if (item.entity_type === 'NGO') navigate(`/nearby-ngos`);
                    else if (item.entity_type === 'EVENT') navigate(`/events`);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#16a34a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#0f172a';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  View Resource Details <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
