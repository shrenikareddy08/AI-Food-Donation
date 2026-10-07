import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock3,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  Truck,
  UserRound,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import MapView from '../components/MapView';
import donationService from '../services/donationService';
import { assignmentService } from '../services/assignmentService';
import { ngoService } from '../services/ngoService';
import { apiClient } from '../services/apiClient';

import { useNow } from '../hooks/useNow';

import '../styles/donor-tracking.css';

const TRACK_STEPS = [
  {
    key: 'SUBMITTED',
    label: 'Donation Submitted',
  },
  {
    key: 'NGO_ACCEPTED',
    label: 'NGO Accepted',
  },
  {
    key: 'VOLUNTEER_ASSIGNED',
    label: 'Volunteer Assigned',
  },
  {
    key: 'PICKED_UP',
    label: 'Picked Up',
  },
  {
    key: 'IN_TRANSIT',
    label: 'In Transit',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
  },
  {
    key: 'NGO_CONFIRMATION',
    label: 'NGO Confirmation',
  },
];

function normalizeDonation(data) {
  if (!data) return null;

  return {
    ...data,
    id: data.id ?? data.donation_id,
    name:
      data.name ??
      data.food_name ??
      data.foodName ??
      'Food Donation',
    food_type:
      data.food_type ??
      data.foodType ??
      '',
    quantity: Number(
      data.quantity ??
        data.quantity_kg ??
        0
    ),
    unit: data.unit ?? 'kg',
    status: String(
      data.status ?? 'POSTED'
    ).toUpperCase(),

    pickup_lat:
      data.pickup_lat ??
      data.pickupLatitude ??
      data.latitude ??
      null,

    pickup_lng:
      data.pickup_lng ??
      data.pickupLongitude ??
      data.longitude ??
      null,

    location:
      data.location ??
      data.pickup_address ??
      data.pickupAddress ??
      data.pickup_location ??
      '',

    ngo_id:
      data.ngo_id ??
      data.ngoId ??
      null,
  };
}

function normalizeNgo(data) {
  if (!data) return null;

  return {
    ...data,

    id:
      data.id ??
      data.ngo_id,

    name:
      data.name ??
      data.ngo_name ??
      'NGO',

    address:
      data.address ??
      data.location ??
      '',

    lat:
      data.lat ??
      data.latitude ??
      data.location_lat ??
      data.locationLatitude ??
      null,

    lng:
      data.lng ??
      data.longitude ??
      data.location_lng ??
      data.locationLongitude ??
      null,
  };
}

function normalizeAssignment(data) {
  if (!data) return null;

  return {
    ...data,

    id:
      data.id ??
      data.assignment_id,

    donation_id:
      data.donation_id ??
      data.donationId,

    volunteer_id:
      data.volunteer_id ??
      data.volunteerId,

    status: String(
      data.status ?? ''
    ).toUpperCase(),
  };
}

function normalizeTracking(data) {
  if (!data) return null;

  return {
    ...data,

    id:
      data.id ??
      data.tracking_id,

    latitude: Number(
      data.latitude ??
        data.lat ??
        0
    ),

    longitude: Number(
      data.longitude ??
        data.lng ??
        0
    ),

    status: String(
      data.status ?? ''
    ).toUpperCase(),

    recorded_at:
      data.recorded_at ??
      data.created_at ??
      data.timestamp ??
      null,
  };
}

function stageFromStatus(status) {
  const normalized =
    String(status || '').toUpperCase();

  if (normalized === 'POSTED') {
    return 0;
  }

  if (
    normalized === 'MATCHED' ||
    normalized === 'ACCEPTED'
  ) {
    return 1;
  }

  if (normalized === 'ASSIGNED') {
    return 2;
  }

  if (normalized === 'PICKED_UP') {
    return 3;
  }

  if (normalized === 'IN_TRANSIT') {
    return 4;
  }

  if (normalized === 'DELIVERED') {
    return 5;
  }

  if (
    normalized === 'CONFIRMED' ||
    normalized === 'COMPLETED'
  ) {
    return 6;
  }

  return 0;
}

function formatStatus(status) {
  return String(
    status || 'POSTED'
  )
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* =========================================================
   DATE / TIME HELPERS
========================================================= */

function formatDay(date) {
  return date.toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
    }
  );
}

function formatDateShort(date) {
  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function formatTime(date) {
  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function DonorTracking() {
  const navigate = useNavigate();
  const { id } = useParams();

  const now = useNow();

  const [donation, setDonation] =
    useState(null);

  const [ngo, setNgo] =
    useState(null);

  const [assignment, setAssignment] =
    useState(null);

  const [tracking, setTracking] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadTrackingData = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      /* ----------------------------------------------------
         DONATION
      ---------------------------------------------------- */

      const donationResponse =
        await donationService.getById(id);

      const donationData =
        donationResponse?.data ??
        donationResponse;

      const normalizedDonation =
        normalizeDonation(
          donationData
        );

      setDonation(
        normalizedDonation
      );

      /* ----------------------------------------------------
         NGO
      ---------------------------------------------------- */

      if (
        normalizedDonation?.ngo_id
      ) {
        try {
          const ngoResponse =
            await ngoService.getById(
              normalizedDonation.ngo_id
            );

          const ngoData =
            ngoResponse?.data ??
            ngoResponse;

          setNgo(
            normalizeNgo(ngoData)
          );
        } catch (ngoError) {
          console.error(
            'NGO loading error:',
            ngoError
          );

          setNgo(null);
        }
      } else {
        setNgo(null);
      }

      /* ----------------------------------------------------
         ASSIGNMENT
      ---------------------------------------------------- */

      try {
        const assignmentResponse =
          await assignmentService.getAll();

        const assignmentData =
          assignmentResponse?.data ??
          assignmentResponse ??
          [];

        const assignmentList =
          Array.isArray(
            assignmentData
          )
            ? assignmentData
            : [];

        const matchingAssignment =
          assignmentList.find(
            (item) =>
              Number(
                item.donation_id ??
                  item.donationId
              ) === Number(id)
          );

        const normalizedAssignment =
          normalizeAssignment(
            matchingAssignment
          );

        setAssignment(
          normalizedAssignment
        );

        /* --------------------------------------------------
           DELIVERY TRACKING
        -------------------------------------------------- */

        if (
          normalizedAssignment?.id
        ) {
          try {
            const trackingResponse =
              await apiClient.get(
                `/api/delivery-tracking/assignment/${normalizedAssignment.id}`
              );

            const trackingData =
              trackingResponse?.data ??
              trackingResponse ??
              [];

            const trackingList =
              Array.isArray(
                trackingData
              )
                ? trackingData
                : [];

            const normalizedTracking =
              trackingList
                .map(
                  normalizeTracking
                )
                .filter(
                  (item) =>
                    Number.isFinite(
                      item.latitude
                    ) &&
                    Number.isFinite(
                      item.longitude
                    ) &&
                    item.latitude !== 0 &&
                    item.longitude !== 0
                );

            setTracking(
              normalizedTracking
            );
          } catch (trackingError) {
            console.error(
              'Tracking loading error:',
              trackingError
            );

            setTracking([]);
          }
        } else {
          setTracking([]);
        }
      } catch (assignmentError) {
        console.error(
          'Assignment loading error:',
          assignmentError
        );

        setAssignment(null);
        setTracking([]);
      }
    } catch (err) {
      console.error(
        'Donation tracking error:',
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to load donation tracking.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadTrackingData();
  }, [id]);

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadTrackingData(true);
      }, 10000);

    return () =>
      clearInterval(interval);
  }, [id]);

  /* =======================================================
     CURRENT STATUS
  ======================================================= */

  const currentStatus =
    useMemo(() => {
      if (
        assignment?.status ===
        'DELIVERED'
      ) {
        return 'DELIVERED';
      }

      if (assignment?.status) {
        return assignment.status;
      }

      return (
        donation?.status ||
        'POSTED'
      );
    }, [
      assignment,
      donation,
    ]);

  const currentStage =
    useMemo(
      () =>
        stageFromStatus(
          currentStatus
        ),
      [currentStatus]
    );

  /* =======================================================
     LATEST TRACKING
  ======================================================= */

  const latestTracking =
    useMemo(() => {
      if (!tracking.length) {
        return null;
      }

      return tracking[
        tracking.length - 1
      ];
    }, [tracking]);

  /* =======================================================
     VOLUNTEER POSITION
     
     IMPORTANT:
     MapView expects latitude/longitude,
     not lat/lng.
  ======================================================= */

  const volunteerPosition =
    useMemo(() => {
      if (!latestTracking) {
        return null;
      }

      return {
        latitude:
          latestTracking.latitude,

        longitude:
          latestTracking.longitude,

        label:
          'Volunteer current location',
      };
    }, [latestTracking]);

  /* =======================================================
     PICKUP POSITION
     
     IMPORTANT:
     MapView expects latitude/longitude.
  ======================================================= */

  const pickupPosition =
    useMemo(() => {
      if (
        donation?.pickup_lat ==
          null ||
        donation?.pickup_lng ==
          null
      ) {
        return null;
      }

      return {
        latitude: Number(
          donation.pickup_lat
        ),

        longitude: Number(
          donation.pickup_lng
        ),

        label:
          donation?.location ||
          'Food pickup location',
      };
    }, [donation]);

  /* =======================================================
     DESTINATION POSITION
     
     IMPORTANT:
     MapView expects latitude/longitude.
  ======================================================= */

  const destinationPosition =
    useMemo(() => {
      if (
        ngo?.lat == null ||
        ngo?.lng == null
      ) {
        return null;
      }

      return {
        latitude: Number(
          ngo.lat
        ),

        longitude: Number(
          ngo.lng
        ),

        label:
          ngo.name ||
          'NGO destination',
      };
    }, [ngo]);

  /* =======================================================
     MAP CENTER
  ======================================================= */

  const mapCenter =
    useMemo(() => {
      if (volunteerPosition) {
        return volunteerPosition;
      }

      if (
        pickupPosition &&
        destinationPosition
      ) {
        return {
          latitude:
            (pickupPosition.latitude +
              destinationPosition.latitude) /
            2,

          longitude:
            (pickupPosition.longitude +
              destinationPosition.longitude) /
            2,
        };
      }

      if (pickupPosition) {
        return pickupPosition;
      }

      if (destinationPosition) {
        return destinationPosition;
      }

      return {
        latitude: 17.385,
        longitude: 78.4867,
      };
    }, [
      volunteerPosition,
      pickupPosition,
      destinationPosition,
    ]);

  const hasNgoLocation =
    Boolean(destinationPosition);

  const hasVolunteerLocation =
    Boolean(volunteerPosition);

  /* =======================================================
     MAP STATUS
  ======================================================= */

  const mapStatusText =
    useMemo(() => {
      if (hasVolunteerLocation) {
        return {
          title:
            'Live delivery location',

          description:
            'Volunteer location is being updated from real tracking data.',

          icon: '🚴',
        };
      }

      if (latestTracking) {
        return {
          title:
            'Last location recorded',

          description:
            'Waiting for the next volunteer location update.',

          icon: '📍',
        };
      }

      if (
        assignment?.status ===
          'PICKED_UP' ||
        assignment?.status ===
          'IN_TRANSIT'
      ) {
        return {
          title:
            'Waiting for location update',

          description:
            'The volunteer has been assigned, but no GPS update is available yet.',

          icon: '📡',
        };
      }

      if (!hasNgoLocation) {
        return {
          title:
            'Destination location pending',

          description:
            'The NGO destination will appear when its coordinates are available.',

          icon: '📍',
        };
      }

      return {
        title:
          'Delivery route',

        description:
          'Pickup and NGO destination are shown on the map.',

        icon: '🗺️',
      };
    }, [
      hasVolunteerLocation,
      latestTracking,
      assignment,
      hasNgoLocation,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="donor-tracking-page">
        <div className="tracking-loading">
          <div className="tracking-loading__spinner">
            <RefreshCw size={22} />
          </div>

          <strong>
            Loading delivery tracking...
          </strong>

          <span>
            Please wait while we get the latest
            donation status.
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !donation) {
    return (
      <div className="donor-tracking-page">
        <div className="tracking-error">
          <div className="tracking-error__icon">
            ⚠️
          </div>

          <h2>
            Tracking unavailable
          </h2>

          <p>
            {error ||
              'We could not find this donation.'}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="tracking-primary-btn"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="donor-tracking-page">

      {/* TOP BAR */}

      <div className="tracking-topbar">
        <button
          type="button"
          className="tracking-back-btn"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="tracking-clock">
          <span>
            {formatDay(now)}
          </span>

          <span>
            {formatDateShort(now)}
          </span>

          <strong>
            {formatTime(now)}
          </strong>
        </div>
      </div>

      {/* HERO */}

      <section className="tracking-hero">
        <div className="tracking-hero__left">
          <div className="tracking-hero__icon">
            <Package size={24} />
          </div>

          <div>
            <span className="tracking-eyebrow">
              DONATION TRACKING
            </span>

            <h1>
              {donation.name}
            </h1>

            <p>
              {donation.quantity}{' '}
              {donation.unit}

              {donation.food_type
                ? ` • ${donation.food_type}`
                : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="tracking-refresh-btn"
          onClick={() =>
            loadTrackingData(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? 'tracking-spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </section>

      {/* MAP */}

      <section className="tracking-card tracking-map-card">
        <div className="tracking-card-header">
          <div>
            <span className="tracking-section-label">
              LIVE DELIVERY MAP
            </span>

            <h2>
              {hasVolunteerLocation
                ? 'Volunteer location'
                : 'Donation route'}
            </h2>
          </div>

          <div
            className={`tracking-map-live ${
              hasVolunteerLocation
                ? 'tracking-map-live--active'
                : ''
            }`}
          >
            <span className="tracking-map-live__dot" />

            {hasVolunteerLocation
              ? 'LIVE'
              : 'UPDATES'}
          </div>
        </div>

        <div className="tracking-map-wrapper">

          <MapView
            center={mapCenter}
            zoom={13}
            pickup={pickupPosition}
            destination={
              destinationPosition
            }
            volunteerPosition={
              volunteerPosition
            }
            height="460px"
          />

          <div className="tracking-map-status">
            <div className="tracking-map-status__icon">
              {mapStatusText.icon}
            </div>

            <div className="tracking-map-status__content">
              <strong>
                {mapStatusText.title}
              </strong>

              <span>
                {mapStatusText.description}
              </span>
            </div>
          </div>

          {!hasNgoLocation && (
            <div className="tracking-destination-pending">
              <MapPin size={14} />

              <span>
                NGO destination pending
              </span>
            </div>
          )}
        </div>

        {/* ROUTE SUMMARY */}

        <div className="tracking-route-summary">

          <div className="tracking-route-point">
            <div className="tracking-route-icon tracking-route-icon--pickup">
              <MapPin size={15} />
            </div>

            <div>
              <span>
                Pickup
              </span>

              <strong>
                {donation?.location ||
                  assignment?.pickup_location ||
                  (pickupPosition
                    ? 'Pickup location selected'
                    : 'Pickup location')}
              </strong>
            </div>
          </div>

          <div className="tracking-route-line" />

          <div className="tracking-route-point">
            <div className="tracking-route-icon tracking-route-icon--ngo">
              <Navigation size={15} />
            </div>

            <div>
              <span>
                Destination
              </span>

              <strong>
                {ngo?.name ||
                  'NGO destination pending'}
              </strong>

              {ngo?.address && (
                <small>
                  {ngo.address}
                </small>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* LATEST LOCATION */}

      {latestTracking && (
        <section className="tracking-card tracking-location-card">

          <div className="tracking-location-icon">
            <Navigation size={19} />
          </div>

          <div className="tracking-location-content">
            <span>
              Latest location update
            </span>

            <strong>
              {latestTracking.latitude.toFixed(
                5
              )}
              ,{' '}
              {latestTracking.longitude.toFixed(
                5
              )}
            </strong>

            <small>
              {latestTracking.recorded_at
                ? new Date(
                    latestTracking.recorded_at
                  ).toLocaleString()
                : 'Recently updated'}
            </small>
          </div>

          <div className="tracking-location-live">
            <span />
            Real data
          </div>

        </section>
      )}

      {/* STATUS */}

      <section className="tracking-card tracking-status-card">

        <div className="tracking-status-main">

          <div className="tracking-status-icon">
            <Truck size={21} />
          </div>

          <div>
            <span>
              Current Status
            </span>

            <h2>
              {formatStatus(
                currentStatus
              )}
            </h2>
          </div>

        </div>

        <div className="tracking-status-time">
          <Clock3 size={15} />

          <span>
            Updated {formatTime(now)}
          </span>
        </div>

      </section>

      {/* TIMELINE */}

      <section className="tracking-card tracking-timeline-card">

        <div className="tracking-card-header">
          <div>
            <span className="tracking-section-label">
              DELIVERY PROGRESS
            </span>

            <h2>
              Donation journey
            </h2>
          </div>
        </div>

        <div className="tracking-timeline">

          {TRACK_STEPS.map(
            (step, index) => {

              const completed =
                index < currentStage;

              const active =
                index === currentStage;

              return (
                <div
                  key={step.key}
                  className={`tracking-step ${
                    completed
                      ? 'tracking-step--completed'
                      : ''
                  } ${
                    active
                      ? 'tracking-step--active'
                      : ''
                  }`}
                >

                  <div className="tracking-step-marker">
                    {completed
                      ? '✓'
                      : index + 1}
                  </div>

                  {index <
                    TRACK_STEPS.length -
                      1 && (
                    <div className="tracking-step-line" />
                  )}

                  <div className="tracking-step-content">

                    <strong>
                      {step.label}
                    </strong>

                    <span>
                      {completed
                        ? 'Completed'
                        : active
                        ? 'Current status'
                        : 'Waiting'}
                    </span>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* DELIVERY DETAILS */}

      <div className="tracking-details-grid">

        <section className="tracking-card tracking-detail-card">

          <div className="tracking-detail-icon">
            <Package size={18} />
          </div>

          <div>
            <span>
              Donation
            </span>

            <strong>
              {donation.name}
            </strong>

            <small>
              {donation.quantity}{' '}
              {donation.unit}
            </small>
          </div>

        </section>

        <section className="tracking-card tracking-detail-card">

          <div className="tracking-detail-icon">
            <UserRound size={18} />
          </div>

          <div>
            <span>
              Volunteer
            </span>

            <strong>
              {assignment
                ? `Volunteer #${assignment.volunteer_id}`
                : 'Not assigned yet'}
            </strong>

            <small>
              {assignment
                ? 'Assigned by MealBridge'
                : 'Waiting for assignment'}
            </small>
          </div>

        </section>

        <section className="tracking-card tracking-detail-card">

          <div className="tracking-detail-icon">
            <MapPin size={18} />
          </div>

          <div>
            <span>
              Recipient NGO
            </span>

            <strong>
              {ngo?.name ||
                'NGO not available yet'}
            </strong>

            <small>
              {ngo?.address ||
                'Destination details will appear when available'}
            </small>
          </div>

        </section>

      </div>

      {/* SAFE TRACKING NOTE */}

      <section className="tracking-note">

        <div className="tracking-note__icon">
          📍
        </div>

        <div>
          <strong>
            Real delivery tracking
          </strong>

          <p>
            The volunteer marker moves only
            when MealBridge receives an actual
            location update. No fake movement
            is shown.
          </p>
        </div>

      </section>

    </div>
  );
}