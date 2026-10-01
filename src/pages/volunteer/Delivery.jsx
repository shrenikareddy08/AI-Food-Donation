import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  Navigation,
} from 'lucide-react';

import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import DeliveryTimeline from '../../components/DeliveryTimeline';
import { useToast } from '../../context/ToastContext';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { formatDistance } from '../../utils/distance';
import { MOCK_ASSIGNMENTS } from '../../utils/mockData';

export default function Delivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [delivered, setDelivered] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const assignment = MOCK_ASSIGNMENTS.find(
    (a) => a.id === parseInt(id)
  );

  const { coords } = useCurrentLocation();

  if (!assignment) {
    return (
      <div
        className="container"
        style={{ paddingTop: 'var(--space-6)' }}
      >
        <Card padding="lg" className="text-center">
          <h2 style={{ marginBottom: 'var(--space-3)' }}>
            Assignment not found
          </h2>

          <Button
            variant="outline"
            leftIcon={ArrowLeft}
            onClick={() =>
              navigate('/volunteer/assignments')
            }
          >
            Back to Assignments
          </Button>
        </Card>
      </div>
    );
  }

  const volunteerPos =
    coords || {
      latitude: 17.42,
      longitude: 78.43,
      label: 'Current Location',
    };

  const handleMarkDelivered = () => {
    setDelivered(true);

    toast.success(
      'Delivery completed! Thank you for your contribution.'
    );
  };

  const handleViewLiveTracking = () => {
    navigate(`/volunteer/tracking/${assignment.id}`);
  };

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
        onClick={() =>
          navigate(
            `/volunteer/assignments/${assignment.id}`
          )
        }
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
        <ArrowLeft size={16} />
        Back to Assignment
      </button>

      {/* Page Header */}
      <div
        className="page-header"
        style={{ marginBottom: 'var(--space-5)' }}
      >
        <h1 className="page-header__title">
          Delivery
        </h1>

        <p className="page-header__subtitle">
          Deliver the food to the destination NGO
        </p>
      </div>

      {/* Pickup Status */}
      <div
        style={{
          marginBottom: 'var(--space-5)',
          padding:
            'var(--space-4) var(--space-5)',
          background: 'var(--color-success-50)',
          borderRadius: 'var(--radius-lg)',
          border:
            '1px solid var(--color-success-200)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <CheckCircle2
          size={20}
          style={{
            color: 'var(--color-success-500)',
          }}
        />

        <span
          style={{
            fontWeight: 600,
            color: 'var(--color-success-500)',
          }}
        >
          Food Picked Up
        </span>

        <span
          style={{
            color:
              'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          — {assignment.foodName},{' '}
          {assignment.quantity} {assignment.unit}
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
            destination={assignment.destination}
            route={[
              [
                volunteerPos.latitude,
                volunteerPos.longitude,
              ],
              [
                assignment.destination.latitude,
                assignment.destination.longitude,
              ],
            ]}
            recenterTrigger={recenterTrigger}
            onRecenter={() =>
              setRecenterTrigger(
                (previous) => previous + 1
              )
            }
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
                  In Transit
                </div>

                <div className="tracking-panel__subtitle">
                  {assignment.foodName} -{' '}
                  {assignment.quantity}{' '}
                  {assignment.unit}
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="tracking-info">
              <div className="tracking-info__item tracking-info__item--full">
                <span className="tracking-info__label">
                  Destination
                </span>

                <span className="tracking-info__value">
                  {assignment.ngo}
                </span>
              </div>

              <div className="tracking-info__item tracking-info__item--full">
                <span className="tracking-info__label">
                  Address
                </span>

                <span className="tracking-info__value">
                  {assignment.ngoAddress}
                </span>
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  Distance
                </span>

                <span className="tracking-info__value tracking-info__value--large">
                  {formatDistance(
                    assignment.distanceKm
                  )}
                </span>
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  ETA
                </span>

                <span className="tracking-info__value tracking-info__value--large tracking-info__value--accent">
                  {assignment.etaMinutes > 0
                    ? `${assignment.etaMinutes} min`
                    : '—'}
                </span>
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  Status
                </span>

                <StatusBadge
                  status={
                    delivered
                      ? 'DELIVERED'
                      : 'IN_TRANSIT'
                  }
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
                  background:
                    'var(--color-success-50)',
                  borderRadius:
                    'var(--radius-lg)',
                }}
              >
                <CheckCircle2
                  size={32}
                  style={{
                    color:
                      'var(--color-success-500)',
                    margin:
                      '0 auto var(--space-2)',
                  }}
                />

                <p
                  style={{
                    fontWeight: 600,
                    color:
                      'var(--color-success-500)',
                  }}
                >
                  Delivery Completed!
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  style={{
                    marginTop: 'var(--space-3)',
                  }}
                  onClick={() =>
                    navigate(
                      '/volunteer/dashboard'
                    )
                  }
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
                {/* FIXED ROUTE */}
                <Button
                  fullWidth
                  leftIcon={Navigation}
                  onClick={handleViewLiveTracking}
                >
                  View Live Tracking
                </Button>

                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={CheckCircle2}
                  onClick={handleMarkDelivered}
                >
                  Mark Delivered
                </Button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div
            className="tracking-panel"
            style={{
              marginTop: 'var(--space-4)',
            }}
          >
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
              currentStatus={
                delivered
                  ? 'DELIVERED'
                  : 'IN_TRANSIT'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}