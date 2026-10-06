import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  Navigation,
  Loader2,
  Package,
  Phone,
} from 'lucide-react';

import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import DeliveryTimeline from '../../components/DeliveryTimeline';
import { useToast } from '../../context/ToastContext';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { apiClient } from '../../services/apiClient';

export default function Delivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const { coords } = useCurrentLocation();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiClient.get(`/api/assignments/${id}`);
        setAssignment(data);

        const currentSt = String(data?.status || '').toUpperCase();
        if (['DELIVERED', 'COMPLETED'].includes(currentSt)) {
          setDelivered(true);
        } else if (currentSt === 'PICKED_UP') {
          // Progress to IN_TRANSIT
          apiClient
            .put(`/api/assignments/${id}/status`, { status: 'IN_TRANSIT' })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load delivery assignment:', err);
        setError(err?.message || 'Assignment not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  if (loading) {
    return (
      <div
        className="container"
        style={{
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          paddingTop: 'var(--space-8)',
        }}
      >
        <Loader2 size={24} className="animate-spin" />
        <span>Loading delivery details...</span>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        <Card padding="lg" className="text-center">
          <h2 style={{ marginBottom: 'var(--space-3)' }}>
            Assignment not found
          </h2>
          <Button
            variant="outline"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/volunteer/assignments')}
          >
            Back to Assignments
          </Button>
        </Card>
      </div>
    );
  }

  const volunteerPos = coords || {
    latitude: 17.4392,
    longitude: 78.4392,
    label: 'Current Location',
  };

  const destinationCoords = {
    latitude: 17.4375,
    longitude: 78.4482,
    label: assignment.delivery_location || 'Destination NGO',
  };

  const handleMarkDelivered = async () => {
    try {
      setActionLoading(true);
      await apiClient.put(`/api/assignments/${id}/status`, {
        status: 'DELIVERED',
      });

      // Try creating delivery confirmation in backend if supported
      try {
        await apiClient.post('/api/delivery-confirmations/', {
          assignment_id: parseInt(id),
          confirmation_type: 'MANUAL',
          recipient_name: assignment.ngo_name || 'NGO Representative',
        });
      } catch (confErr) {
        // Non-blocking confirmation logging
        console.warn('Confirmation log notice:', confErr);
      }

      setDelivered(true);
      toast.success('Delivery completed! Thank you for redistributing food with MealBridge.');
    } catch (err) {
      console.error('Error completing delivery:', err);
      toast.error(err?.message || 'Failed to complete delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewLiveTracking = () => {
    navigate(`/volunteer/tracking/${id}`);
  };

  const foodTitle = assignment.food_name || assignment.foodName || 'Food Item';
  const foodQty = assignment.quantity ?? null;
  const foodUnit = assignment.unit || 'servings';
  const ngoName = assignment.ngo_name || assignment.ngo || 'Partner NGO';
  const ngoAddress = assignment.delivery_location || 'NGO Facility';
  const ngoPhone = assignment.ngo_phone || assignment.ngoPhone || '';

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-9)',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(`/volunteer/assignments/${id}`)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          marginBottom: 'var(--space-5)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} /> Back to Assignment
      </button>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="page-header__title">Delivery</h1>
        <p className="page-header__subtitle">
          Deliver the food donation to the destination NGO
        </p>
      </div>

      {/* Pickup Status Bar */}
      <div
        style={{
          marginBottom: 'var(--space-5)',
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--color-success-50)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-success-200)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <CheckCircle2 size={20} style={{ color: 'var(--color-success-500)' }} />
        <span style={{ fontWeight: 600, color: 'var(--color-success-500)' }}>
          Food Picked Up
        </span>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          — {foodTitle}, {foodQty !== null ? `${foodQty} ${foodUnit}` : 'standard portion'}
        </span>
      </div>

      {/* Tracking Layout */}
      <div className="tracking-layout">
        {/* Map */}
        <div className="tracking-layout__map">
          <MapView
            center={volunteerPos}
            zoom={13}
            volunteerPosition={volunteerPos}
            destination={destinationCoords}
            route={[
              [volunteerPos.latitude, volunteerPos.longitude],
              [destinationCoords.latitude, destinationCoords.longitude],
            ]}
            recenterTrigger={recenterTrigger}
            onRecenter={() => setRecenterTrigger((p) => p + 1)}
            height="100%"
          />
        </div>

        {/* Right Panel */}
        <div className="tracking-layout__panel">
          <div className="tracking-panel">
            {/* Header */}
            <div className="tracking-panel__header">
              <div className="tracking-panel__icon">
                <Truck size={22} />
              </div>
              <div>
                <div className="tracking-panel__title">
                  {delivered ? 'Delivered' : 'In Transit'}
                </div>
                <div className="tracking-panel__subtitle">
                  {foodTitle} — {foodQty !== null ? `${foodQty} ${foodUnit}` : ''}
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="tracking-info">
              <div className="tracking-info__item tracking-info__item--full">
                <span className="tracking-info__label">Destination NGO</span>
                <span className="tracking-info__value">{ngoName}</span>
              </div>

              <div className="tracking-info__item tracking-info__item--full">
                <span className="tracking-info__label">Delivery Address</span>
                <span className="tracking-info__value">{ngoAddress}</span>
              </div>

              {ngoPhone && (
                <div className="tracking-info__item tracking-info__item--full">
                  <span className="tracking-info__label">NGO Contact</span>
                  <span className="tracking-info__value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={14} /> {ngoPhone}
                  </span>
                </div>
              )}

              <div className="tracking-info__item">
                <span className="tracking-info__label">Status</span>
                <StatusBadge
                  status={delivered ? 'DELIVERED' : 'IN_TRANSIT'}
                  size="sm"
                />
              </div>
            </div>

            {/* Actions */}
            {delivered ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-4)',
                  background: 'var(--color-success-50)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <CheckCircle2
                  size={32}
                  style={{
                    color: 'var(--color-success-500)',
                    margin: '0 auto var(--space-2)',
                  }}
                />
                <p style={{ fontWeight: 600, color: 'var(--color-success-500)' }}>
                  Delivery Completed!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => navigate('/volunteer/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <Button
                  fullWidth
                  leftIcon={Navigation}
                  onClick={handleViewLiveTracking}
                >
                  View Live Route
                </Button>

                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={CheckCircle2}
                  disabled={actionLoading}
                  onClick={handleMarkDelivered}
                >
                  {actionLoading ? 'Confirming...' : 'Mark Delivered'}
                </Button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="tracking-panel" style={{ marginTop: 'var(--space-4)' }}>
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
              }}
            >
              Timeline
            </h3>
            <DeliveryTimeline
              currentStatus={delivered ? 'DELIVERED' : 'IN_TRANSIT'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}