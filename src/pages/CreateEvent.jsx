import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Sparkles, ArrowLeft } from 'lucide-react';
import { eventService } from '../services/eventService';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    event_name: '',
    event_type: 'BIRTHDAY',
    event_date: '',
    location: '',
    expected_attendees: 100,
    food_type: 'VEGETARIAN',
    estimated_leftover_meals: 40,
    latitude: 17.4435,
    longitude: 78.3772
  });

  const eventTypes = [
    { id: 'BIRTHDAY', label: 'Birthday Celebration' },
    { id: 'WEDDING', label: 'Wedding / Reception' },
    { id: 'ANNIVERSARY', label: 'Anniversary' },
    { id: 'CORPORATE', label: 'Corporate Event / Conference' },
    { id: 'COMMUNITY', label: 'Community / Religious Gathering' },
    { id: 'FESTIVAL', label: 'Festival Banquet' },
    { id: 'OTHER', label: 'Other Social Function' },
  ];

  const foodTypes = [
    { id: 'VEGETARIAN', label: 'Vegetarian' },
    { id: 'NON_VEGETARIAN', label: 'Non-Vegetarian' },
    { id: 'VEGAN', label: 'Vegan' },
    { id: 'MIXED', label: 'Mixed Menu' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await eventService.createEvent({
        ...form,
        expected_attendees: parseInt(form.expected_attendees, 10),
        estimated_leftover_meals: parseInt(form.estimated_leftover_meals, 10),
        event_date: new Date(form.event_date).toISOString(),
      });
      navigate('/events');
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err?.response?.data?.detail || 'Failed to create event. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px' }}>
      <button
        onClick={() => navigate('/events')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        <ArrowLeft size={16} /> Back to Events
      </button>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>
            <Sparkles size={16} /> PRE-EVENT REGISTRATION
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
            Register Function / Banquet
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Proactively coordinate with nearby NGOs before your event to guarantee immediate leftover pickup.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Event Name */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Birthday Celebration, Annual Corporate Banquet"
              value={form.event_name}
              onChange={(e) => setForm({ ...form, event_name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Event Type & Food Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Event Category *
              </label>
              <select
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              >
                {eventTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Dietary Type *
              </label>
              <select
                value={form.food_type}
                onChange={(e) => setForm({ ...form, food_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              >
                {foodTypes.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Event Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Venue / Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Novotel Convention Hall, Hitec City, Hyderabad"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Attendees & Leftover Estimates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Expected Guests
              </label>
              <input
                type="number"
                min="10"
                value={form.expected_attendees}
                onChange={(e) => setForm({ ...form, expected_attendees: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Estimated Surplus Meals
              </label>
              <input
                type="number"
                min="0"
                value={form.estimated_leftover_meals}
                onChange={(e) => setForm({ ...form, estimated_leftover_meals: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Calendar size={18} />
            {loading ? 'Registering Event...' : 'Register Event & Schedule Surplus'}
          </button>
        </form>
      </div>
    </div>
  );
}
