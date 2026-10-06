import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Plus, CheckCircle, AlertTriangle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { eventService } from '../services/eventService';

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getEvents();
      setEvents(res || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleConvertToDonation = async (eventId, eventName, leftoverMeals) => {
    try {
      setActionLoading(eventId);
      const res = await eventService.convertToDonation(eventId, {
        food_name: `${eventName} Leftover Meals`,
        quantity: leftoverMeals,
        unit: 'meals',
        expiry_hours: 6
      });
      setStatusMessage({
        type: 'success',
        text: `Success! Leftovers converted to live Donation #${res.donation_id}. Matching NGOs are being notified!`
      });
      fetchEvents();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to convert event surplus into donation.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclareFood = async (eventId) => {
    const qty = window.prompt('Enter estimated surplus meals available for donation:', '60');
    if (!qty || isNaN(qty) || Number(qty) <= 0) return;

    try {
      setActionLoading(eventId);
      await eventService.declareLeftovers(eventId, {
        estimated_leftover_meals: parseInt(qty, 10),
      });
      setStatusMessage({
        type: 'success',
        text: `Leftover surplus updated to ${qty} meals! You can now convert it to a live donation.`
      });
      fetchEvents();
    } catch (err) {
      alert('Failed to update leftovers.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CREATED':
        return { bg: '#e0f2fe', text: '#0369a1', label: 'Event Registered' };
      case 'FOOD_AVAILABLE':
        return { bg: '#fef3c7', text: '#92400e', label: 'Surplus Declared' };
      case 'CONVERTED_TO_DONATION':
        return { bg: '#dcfce7', text: '#15803d', label: 'Converted to Donation' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: status };
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>
            <Sparkles size={16} /> Feature E: Event-Based Food Distribution
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
            Event Food Donation Module
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Register weddings, parties, and corporate banquets — turn perishable leftovers into verified meals.
          </p>
        </div>

        <Link
          to="/events/create"
          style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
          }}
        >
          <Plus size={18} /> Register Event
        </Link>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div style={{
          backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <div>{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Event Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#16a34a' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
          <div>Loading registered events...</div>
        </div>
      ) : events.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          color: '#64748b'
        }}>
          <Calendar size={48} style={{ margin: '0 auto 12px auto', color: '#94a3b8' }} />
          <h3 style={{ color: '#0f172a', fontSize: '18px', margin: '0 0 8px 0' }}>No Events Registered Yet</h3>
          <p style={{ maxWidth: '460px', margin: '0 auto 20px auto', fontSize: '14px' }}>
            Hosting a birthday celebration, wedding, or conference? Register your event so you can convert surplus meals to donations with 1 click.
          </p>
          <Link
            to="/events/create"
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: '600',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Register First Event
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
          {events.map((ev) => {
            const badge = getStatusBadge(ev.status);
            const isConverting = actionLoading === ev.event_id;

            return (
              <div
                key={ev.event_id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '20px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Status & Type */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase'
                    }}>
                      {ev.event_type}
                    </span>
                    <span style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>
                    {ev.event_name}
                  </h3>

                  {/* Metadata */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} style={{ color: '#16a34a' }} />
                      <span>{new Date(ev.event_date).toLocaleDateString()} at {new Date(ev.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={15} style={{ color: '#2563eb' }} />
                      <span>{ev.expected_attendees} Expected Guests • {ev.food_type}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} style={{ color: '#ef4444' }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{ev.location}</span>
                    </div>

                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginTop: '4px',
                      fontWeight: '600',
                      color: ev.estimated_leftover_meals > 0 ? '#15803d' : '#64748b'
                    }}>
                      Surplus Estimate: {ev.estimated_leftover_meals} meals
                    </div>
                  </div>
                </div>

                {/* Bottom Actions based on status */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '10px' }}>
                  {ev.status === 'CREATED' && (
                    <button
                      onClick={() => handleDeclareFood(ev.event_id)}
                      disabled={isConverting}
                      style={{
                        width: '100%',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0f172a',
                        cursor: 'pointer'
                      }}
                    >
                      Declare Leftover Surplus
                    </button>
                  )}

                  {ev.status === 'FOOD_AVAILABLE' && (
                    <button
                      onClick={() => handleConvertToDonation(ev.event_id, ev.event_name, ev.estimated_leftover_meals)}
                      disabled={isConverting}
                      style={{
                        width: '100%',
                        backgroundColor: '#16a34a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      <Sparkles size={16} />
                      {isConverting ? 'Converting...' : 'Convert to Live Donation'}
                    </button>
                  )}

                  {ev.status === 'CONVERTED_TO_DONATION' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#15803d',
                      backgroundColor: '#f0fdf4',
                      padding: '8px 12px',
                      borderRadius: '8px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                        <CheckCircle size={14} /> Donation #{ev.converted_donation_id} Live
                      </span>
                      <Link to="/donor/donations" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}>
                        View →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
