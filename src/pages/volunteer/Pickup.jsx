import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Navigation,
  Loader2,
} from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import DeliveryTimeline from '../../components/DeliveryTimeline';
import { useToast } from '../../context/ToastContext';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { apiClient } from '../../services/apiClient';

export default function Pickup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pickupStarted, setPickupStarted] = useState(false);
  const [pickedUp, setPickedUp] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const { coords, loading: locLoading } = useCurrentLocation();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiClient.get(`/api/assignments/${id}`);
        setAssignment(data);

        const currentSt = String(data?.status || '').toUpperCase();
        if (currentSt === 'PICKUP_IN_PROGRESS') {
          setPickupStarted(true);
        } else if (['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(currentSt)) {
          setPickupStarted(true);
          setPickedUp(true);
        }
      } catch (err) {
        console.error('Failed to load assignment for pickup:', err);
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
        <span>Loading pickup details...</span>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        <Card padding="lg" className="text-center">
          <h2 style={{ marginBottom: 'var(--space-3)' }}>Assignment not found</h2>
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

  const pickupCoords = {
    latitude: 17.4485,
    longitude: 78.3748,
    label: assignment.pickup_location || 'Pickup Location',
  };

  const handleStartPickup = async () => {
    try {
      setActionLoading(true);
      await apiClient.put(`/api/assignments/${id}/status`, {
        status: 'PICKUP_IN_PROGRESS',
      });
      setPickupStarted(true);
      toast.info('Pickup started. Navigate to the donor location.');
    } catch (err) {
      console.error('Error starting pickup:', err);
      toast.error(err?.message || 'Failed to start pickup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPickedUp = async () => {
    try {
      setActionLoading(true);
      await apiClient.put(`/api/assignments/${id}/status`, {
        status: 'PICKED_UP',
      });
      setPickedUp(true);
      toast.success('Food picked up successfully! Proceed to delivery.');
      setTimeout(() => navigate(`/volunteer/delivery/${id}`), 1200);
    } catch (err) {
      console.error('Error marking picked up:', err);
      toast.error(err?.message || 'Failed to update pickup status');
    } finally {
      setActionLoading(false);
    }
  };

  const currentStatus = pickedUp
    ? 'PICKED_UP'
    : pickupStarted
    ? 'PICKUP_IN_PROGRESS'
    : 'ASSIGNED';

  const foodTitle = assignment.food_name || assignment.foodName || 'Food Donation';
  const foodQty = assignment.quantity ?? null;
  const foodUnit = assignment.unit || 'servings';
  const donorName = assignment.donor_name || assignment.donor || 'Food Donor';
  const pickupLocStr = assignment.pickup_location || 'Donor Address';

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-9)',
      }}
    >
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

      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="page-header__title">Pickup</h1>
        <p className="page-header__subtitle">Navigate to the donor and collect the food donation</p>
      </div>

      <div className="tracking-layout">
        <div className="tracking-layout__map">
          <MapView
            center={volunteerPos}
            zoom={14}
            pickup={pickupCoords}
            volunteerPosition={volunteerPos}
            route={[
              [volunteerPos.latitude, volunteerPos.longitude],
              [pickupCoords.latitude, pickupCoords.longitude],
            ]}
            recenterTrigger={recenterTrigger}
            onRecenter={() => setRecenterTrigger((p) => p + 1)}
            height="100%"
          />
        </div>

        <div className="tracking-layout__panel">
          <div className="tracking-panel">
            <div className="tracking-panel__header">
              <div
                className="tracking-panel__icon"
                style={
                  pickedUp
                    ? {
                        background: 'var(--color-success-50)',
                        color: 'var(--color-success-500)',
                      }
                    : {}
                }
              >
                {pickedUp ? <CheckCircle2 size={22} /> : <Package size={22} />}
              </div>
              <div>
                <div className="tracking-panel__title">{foodTitle}</div>
                <div className="tracking-panel__subtitle">
                  {foodQty !== null ? `${foodQty} ${foodUnit}` : 'Standard portion'}
                </div>
              </div>
            </div>

            <div className="tracking-info">
              <div className="tracking-info__item">
                <span className="tracking-info__label">Donor</span>
                <span className="tracking-info__value">{donorName}</span>
              </div>
              <div className="tracking-info__item">
                <span className="tracking-info__label">Status</span>
                <span className="tracking-info__value">
                  <StatusBadge status={currentStatus} size="sm" />
                </span>
              </div>
              <div className="tracking-info__item tracking-info__item--full">
                <span className="tracking-info__label">Pickup Location</span>
                <span className="tracking-info__value">{pickupLocStr}</span>
              </div>
            </div>

            {pickedUp ? (
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
                  Food Picked Up!
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  Redirecting to delivery...
                </p>
              </div>
            ) : !pickupStarted ? (
              <Button
                fullWidth
                leftIcon={Truck}
                disabled={actionLoading}
                onClick={handleStartPickup}
              >
                {actionLoading ? 'Starting Pickup...' : 'Start Pickup'}
              </Button>
            ) : (
              <Button
                fullWidth
                leftIcon={CheckCircle2}
                disabled={actionLoading}
                onClick={handleMarkPickedUp}
              >
                {actionLoading ? 'Updating Status...' : 'Mark Food Picked Up'}
              </Button>
            )}
          </div>

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
            <DeliveryTimeline currentStatus={currentStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}
