import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Navigation,
  Crosshair,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';

import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import DeliveryTimeline from '../../components/DeliveryTimeline';

import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useNow } from '../../hooks/useNow';

import { formatTime, timeAgo } from '../../utils/formatDate';
import { formatDistance } from '../../utils/distance';
import { MOCK_ASSIGNMENTS } from '../../utils/mockData';

export default function LiveTracking() {
  const { id } = useParams();
  const now = useNow();

  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [lastShareUpdate, setLastShareUpdate] =
    useState(null);

  /*
   * Find assignment
   */
  const assignment = MOCK_ASSIGNMENTS.find(
    (a) => String(a.id) === String(id)
  );

  /*
   * Current GPS location
   */
  const { coords: gpsPosition } =
    useCurrentLocation();

  /*
   * If assignment does not exist
   */
  if (!assignment) {
    return (
      <div
        className="container"
        style={{
          paddingTop: 'var(--space-6)',
          paddingBottom: 'var(--space-9)',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto',
            textAlign: 'center',
            padding: 'var(--space-8)',
          }}
        >
          <Truck
            size={48}
            style={{
              margin: '0 auto var(--space-4)',
              opacity: 0.5,
            }}
          />

          <h2
            style={{
              marginBottom: 'var(--space-3)',
            }}
          >
            Assignment not found
          </h2>

          <p
            style={{
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-5)',
            }}
          >
            The assignment could not be found.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
            }}
          >
            <Button
              type="button"
              variant="outline"
              leftIcon={ArrowLeft}
              onClick={() => {
                window.location.href =
                  '/volunteer/assignments';
              }}
            >
              Assignments
            </Button>

            <Button
              type="button"
              leftIcon={LayoutDashboard}
              onClick={() => {
                window.location.href =
                  '/volunteer/dashboard';
              }}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Delivery information
   */
  const delivery = {
    pickup: assignment.pickup,
    destination: assignment.destination,
    distanceKm: assignment.distanceKm,
    etaMinutes: assignment.etaMinutes,
    status: assignment.status || 'IN_TRANSIT',
  };

  /*
   * Tracking hook
   */
  const {
    position: trackPos,
    status,
    eta,
    distanceRemaining,
    lastUpdated,
    start,
    stop,
  } = useDeliveryTracking(delivery);

  /*
   * Start tracking
   */
  useEffect(() => {
    start();

    return () => {
      stop();
    };
  }, [start, stop]);

  /*
   * Location sharing
   */
  const handleToggleSharing = useCallback(() => {
    if (!sharing) {
      setSharing(true);
      setLastShareUpdate(new Date());
    } else {
      setSharing(false);
    }
  }, [sharing]);

  /*
   * Back to assignment
   */
  const handleBack = () => {
    window.location.href =
      `/volunteer/assignments/${assignment.id}`;
  };

  /*
   * Go to dashboard
   */
  const handleDashboard = () => {
    window.location.href =
      '/volunteer/dashboard';
  };

  /*
   * Go to assignments
   */
  const handleAssignments = () => {
    window.location.href =
      '/volunteer/assignments';
  };

  /*
   * Go to delivery
   */
  const handleDelivery = () => {
    window.location.href =
      `/volunteer/delivery/${assignment.id}`;
  };

  /*
   * Recenter map
   */
  const handleRecenter = () => {
    setRecenterTrigger(
      (previous) => previous + 1
    );
  };

  /*
   * Current volunteer position
   */
  const volunteerPos =
    sharing && gpsPosition
      ? gpsPosition
      : trackPos || assignment.pickup;

  /*
   * Check pickup coordinates
   */
  const hasPickup =
    assignment.pickup &&
    typeof assignment.pickup.latitude === 'number' &&
    typeof assignment.pickup.longitude === 'number';

  /*
   * Check destination coordinates
   */
  const hasDestination =
    assignment.destination &&
    typeof assignment.destination.latitude ===
      'number' &&
    typeof assignment.destination.longitude ===
      'number';

  /*
   * Check volunteer coordinates
   */
  const hasVolunteerPosition =
    volunteerPos &&
    typeof volunteerPos.latitude === 'number' &&
    typeof volunteerPos.longitude === 'number';

  /*
   * Show map only when all coordinates exist
   */
  const canShowMap =
    hasPickup &&
    hasDestination &&
    hasVolunteerPosition;

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-9)',
      }}
    >
      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back to Assignment
        </button>

        <Button
          type="button"
          variant="outline"
          leftIcon={LayoutDashboard}
          onClick={handleDashboard}
        >
          Dashboard
        </Button>
      </div>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div
        className="page-header"
        style={{
          marginBottom: 'var(--space-5)',
        }}
      >
        <h1 className="page-header__title">
          Live Tracking
        </h1>

        <p className="page-header__subtitle">
          Real-time delivery tracking
        </p>
      </div>

      {/* =====================================================
          TRACKING LAYOUT
      ===================================================== */}

      <div className="tracking-layout">
        {/* =================================================
            MAP
        ================================================= */}

        <div className="tracking-layout__map">
          {canShowMap ? (
            <MapView
              center={volunteerPos}
              zoom={13}
              pickup={assignment.pickup}
              destination={assignment.destination}
              volunteerPosition={volunteerPos}
              route={[
                [
                  assignment.pickup.latitude,
                  assignment.pickup.longitude,
                ],
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
              onRecenter={handleRecenter}
              height="100%"
            />
          ) : (
            <div
              style={{
                height: '100%',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 'var(--space-6)',
                background:
                  'var(--color-surface-secondary)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div>
                <Navigation
                  size={40}
                  style={{
                    margin:
                      '0 auto var(--space-3)',
                    opacity: 0.5,
                  }}
                />

                <p
                  style={{
                    fontWeight: 600,
                    marginBottom:
                      'var(--space-2)',
                  }}
                >
                  Location not available
                </p>

                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color:
                      'var(--color-text-secondary)',
                  }}
                >
                  Waiting for valid location data.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            RIGHT PANEL
        ================================================= */}

        <div className="tracking-layout__panel">
          <div className="tracking-panel">
            {/* Header */}
            <div className="tracking-panel__header">
              <div className="tracking-panel__icon">
                <Truck size={22} />
              </div>

              <div>
                <div className="tracking-panel__title">
                  Delivery In Progress
                </div>

                <div className="tracking-panel__subtitle">
                  {assignment.foodName} -{' '}
                  {assignment.quantity}{' '}
                  {assignment.unit}
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="tracking-info">
              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  Pickup
                </span>

                <span className="tracking-info__value">
                  {assignment.pickupArea || '—'}
                </span>
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  Destination
                </span>

                <span className="tracking-info__value">
                  {assignment.ngo || '—'}
                </span>
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  Status
                </span>

                <StatusBadge
                  status={
                    status || 'IN_TRANSIT'
                  }
                  size="sm"
                />
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  Current Time
                </span>

                <span className="tracking-info__value">
                  {formatTime(now)}
                </span>
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  ETA
                </span>

                <span className="tracking-info__value tracking-info__value--large tracking-info__value--accent">
                  {eta != null
                    ? `${eta} min`
                    : '—'}
                </span>
              </div>

              <div className="tracking-info__item">
                <span className="tracking-info__label">
                  Distance Remaining
                </span>

                <span className="tracking-info__value tracking-info__value--large">
                  {distanceRemaining != null
                    ? formatDistance(
                        distanceRemaining
                      )
                    : '—'}
                </span>
              </div>

              <div className="tracking-info__item tracking-info__item--full">
                <span className="tracking-info__label">
                  Last Updated
                </span>

                <span className="tracking-info__value">
                  {lastUpdated
                    ? timeAgo(lastUpdated)
                    : 'Waiting...'}
                </span>
              </div>
            </div>

            {/* =================================================
                LOCATION SHARING
            ================================================= */}

            <div className="location-sharing">
              <div className="location-sharing__info">
                <span
                  className={`location-sharing__status ${
                    sharing
                      ? 'location-sharing__status--on'
                      : 'location-sharing__status--off'
                  }`}
                >
                  <Navigation size={14} />

                  Location Sharing:{' '}
                  {sharing ? 'ON' : 'OFF'}
                </span>

                {sharing && (
                  <span className="location-sharing__last">
                    Last update:{' '}
                    {lastShareUpdate
                      ? timeAgo(
                          lastShareUpdate
                        )
                      : 'Just now'}
                  </span>
                )}
              </div>

              <button
                type="button"
                className={`location-sharing__toggle ${
                  sharing
                    ? 'location-sharing__toggle--on'
                    : ''
                }`}
                onClick={
                  handleToggleSharing
                }
                aria-label="Toggle location sharing"
              >
                <span className="location-sharing__toggle-knob" />
              </button>
            </div>

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <Button
                type="button"
                size="sm"
                fullWidth
                variant="outline"
                leftIcon={Crosshair}
                onClick={handleRecenter}
              >
                Recenter
              </Button>

              <Button
                type="button"
                size="sm"
                fullWidth
                variant={
                  sharing
                    ? 'danger'
                    : 'primary'
                }
                leftIcon={Navigation}
                onClick={
                  handleToggleSharing
                }
              >
                {sharing
                  ? 'Stop Location Sharing'
                  : 'Start Location Sharing'}
              </Button>

              <Button
                type="button"
                size="sm"
                fullWidth
                leftIcon={CheckCircle2}
                onClick={handleDelivery}
              >
                Go to Delivery
              </Button>

              <Button
                type="button"
                size="sm"
                fullWidth
                variant="ghost"
                leftIcon={LayoutDashboard}
                onClick={handleDashboard}
              >
                Go to Dashboard
              </Button>

              <Button
                type="button"
                size="sm"
                fullWidth
                variant="ghost"
                onClick={handleAssignments}
              >
                All Assignments
              </Button>
            </div>
          </div>

          {/* =================================================
              TIMELINE
          ================================================= */}

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
                marginBottom:
                  'var(--space-4)',
              }}
            >
              Timeline
            </h3>

            <DeliveryTimeline
              currentStatus={
                status || 'IN_TRANSIT'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}