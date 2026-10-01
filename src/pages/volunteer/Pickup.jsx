import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, User, MapPin, Clock, CheckCircle2,
  Truck, Navigation,
} from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import DeliveryTimeline from '../../components/DeliveryTimeline';
import { useToast } from '../../context/ToastContext';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { MOCK_ASSIGNMENTS } from '../../utils/mockData';

export default function Pickup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [pickupStarted, setPickupStarted] = useState(false);
  const [pickedUp, setPickedUp] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const assignment = MOCK_ASSIGNMENTS.find((a) => a.id === parseInt(id));
  const { coords, loading: locLoading } = useCurrentLocation();

  if (!assignment) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        <Card padding="lg" className="text-center">
          <h2 style={{ marginBottom: 'var(--space-3)' }}>Assignment not found</h2>
          <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate('/volunteer/assignments')}>
            Back to Assignments
          </Button>
        </Card>
      </div>
    );
  }

  const volunteerPos = coords || { latitude: 17.4392, longitude: 78.4392, label: 'Current Location' };

  const handleStartPickup = () => {
    setPickupStarted(true);
    toast.info('Pickup started. Navigate to the donor location.');
  };

  const handleMarkPickedUp = () => {
    setPickedUp(true);
    toast.success('Food picked up successfully! Proceed to delivery.');
    setTimeout(() => navigate(`/volunteer/delivery/${assignment.id}`), 1500);
  };

  const currentStatus = pickedUp ? 'PICKED_UP' : pickupStarted ? 'ASSIGNED' : 'ASSIGNED';

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-9)' }}>
      <button
        onClick={() => navigate(`/volunteer/assignments/${assignment.id}`)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-5)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={16} /> Back to Assignment
      </button>

      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="page-header__title">Pickup</h1>
        <p className="page-header__subtitle">Navigate to the donor and pick up the food</p>
      </div>

      <div className="tracking-layout">
        <div className="tracking-layout__map">
          <MapView
            center={volunteerPos}
            zoom={14}
            pickup={assignment.pickup}
            volunteerPosition={volunteerPos}
            route={[
              [volunteerPos.latitude, volunteerPos.longitude],
              [assignment.pickup.latitude, assignment.pickup.longitude],
            ]}
            recenterTrigger={recenterTrigger}
            onRecenter={() => setRecenterTrigger((p) => p + 1)}
            height="100%"
          />
        </div>

        <div className="tracking-layout__panel">
          <div className="tracking-panel">
            <div className="tracking-panel__header">
              <div className="tracking-panel__icon" style={pickedUp ? { background: 'var(--color-success-50)', color: 'var(--color-success-500)' } : {}}>
                {pickedUp ? <CheckCircle2 size={22} /> : <Package size={22} />}
              </div>
              <div>
                <div className="tracking-panel__title">{assignment.foodName}</div>
                <div className="tracking-panel__subtitle">{assignment.quantity} {assignment.unit}</div>
              </div>
            </div>

            <div className="tracking-info">
              <div className="tracking-info__item">
                <span className="tracking-info__label">Donor</span>
                <span className="tracking-info__value">{assignment.donor}</span>
              </div>
              <div className="tracking-info__item">
                <span className="tracking-info__label">Pickup Time</span>
                <span className="tracking-info__value">{assignment.pickupTime}</span>
              </div>
              <div className="tracking-info__item tracking-info__item--full">
                <span className="tracking-info__label">Pickup Location</span>
                <span className="tracking-info__value">{assignment.pickupArea}, {assignment.pickupCity}</span>
              </div>
            </div>

            {pickedUp ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-success-50)', borderRadius: 'var(--radius-lg)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--color-success-500)', margin: '0 auto var(--space-2)' }} />
                <p style={{ fontWeight: 600, color: 'var(--color-success-500)' }}>Food Picked Up!</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                  Redirecting to delivery...
                </p>
              </div>
            ) : !pickupStarted ? (
              <Button fullWidth leftIcon={Truck} onClick={handleStartPickup}>
                Start Pickup
              </Button>
            ) : (
              <Button fullWidth leftIcon={CheckCircle2} onClick={handleMarkPickedUp}>
                Mark Food Picked Up
              </Button>
            )}
          </div>

          <div className="tracking-panel" style={{ marginTop: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Timeline</h3>
            <DeliveryTimeline currentStatus={currentStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}
