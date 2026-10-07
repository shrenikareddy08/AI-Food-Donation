import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  Navigation,
  User,
  AlertCircle,
} from 'lucide-react';

import { apiClient } from '../../services/apiClient';
import MapView from '../../components/MapView';
import { getFoodImage } from '../../utils/foodImages';

const styles = `
  .ngo-tracking-page {
    min-height: 100vh;
    background: #07140f;
    color: #f4faf6;
    padding: 24px;
  }

  .ngo-tracking-page * {
    box-sizing: border-box;
  }

  .tracking-topbar {
    max-width: 1200px;
    margin: 0 auto 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }

  .back-button {
    border: 1px solid rgba(255,255,255,.12);
    background: #10221a;
    color: #eaf7ef;
    padding: 11px 17px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .tracking-id {
    color: #9fb8aa;
    font-size: 14px;
  }

  .ngo-tracking-container {
    max-width: 1200px;
    margin: auto;
  }

  .tracking-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 24px;
  }

  .page-label,
  .small-label {
    color: #73d49b;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.4px;
  }

  .tracking-header h1 {
    margin: 7px 0;
    font-size: 32px;
    color: #ffffff !important;
  }

  .tracking-header p {
    margin: 0;
    color: #9fb8aa;
  }

  .tracking-status-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 999px;
    color: #76dfa0;
    background: rgba(68,190,117,.12);
    border: 1px solid rgba(68,190,117,.22);
    font-size: 13px;
    font-weight: 700;
  }

  .tracking-food-card {
    display: grid;
    grid-template-columns: 220px 1fr;
    background: #0c1d15;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 19px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .tracking-food-image {
    min-height: 210px;
    background: #10261c;
  }

  .tracking-food-image img {
    width: 100%;
    height: 100%;
    min-height: 210px;
    object-fit: cover;
    display: block;
  }

  .tracking-image-placeholder {
    min-height: 210px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #789487;
  }

  .tracking-food-info {
    padding: 25px;
  }

  .tracking-food-info h2 {
    margin: 7px 0 22px;
    font-size: 25px;
    color: #ffffff !important;
  }

  .tracking-food-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 13px;
  }

  .tracking-food-details div {
    background: #11261c;
    border-radius: 12px;
    padding: 14px;
  }

  .tracking-food-details span,
  .schedule-grid span {
    display: block;
    color: #819b8c;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .tracking-food-details strong,
  .schedule-grid strong {
    font-size: 14px;
  }

  .tracking-card {
    background: #0c1d15;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 18px;
    padding: 25px;
    margin-bottom: 20px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 22px;
  }

  .section-title svg {
    color: #6ed798;
  }

  .section-title h2 {
    margin: 0;
    font-size: 18px;
    color: #ffffff !important;
  }

  .delivery-timeline {
    position: relative;
    padding-left: 10px;
  }

  .timeline-item {
    display: flex;
    gap: 15px;
    position: relative;
    padding-bottom: 28px;
  }

  .timeline-item:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 17px;
    top: 36px;
    width: 2px;
    height: calc(100% - 18px);
    background: #263c31;
  }

  .timeline-item.completed:not(:last-child)::after {
    background: #3dbb70;
  }

  .timeline-icon {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    background: #16291f;
    border: 1px solid #30483a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #728d7d;
    z-index: 1;
  }

  .timeline-item.completed .timeline-icon {
    background: #163b28;
    border-color: #3dbb70;
    color: #70dc99;
  }

  .timeline-content h3 {
    margin: 2px 0 6px;
    font-size: 15px;
  }

  .timeline-content p {
    margin: 0;
    color: #849d8e;
    font-size: 13px;
  }

  .tracking-map-wrapper {
    height: 400px;
    border-radius: 15px;
    overflow: hidden;
    position: relative;
    background: #10221a;
  }

  .live-location-label {
    position: absolute;
    top: 14px;
    left: 14px;
    z-index: 500;
    background: rgba(7,20,15,.92);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 10px;
    padding: 9px 12px;
    color: #e8f7ed;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ee38b;
    box-shadow: 0 0 0 4px rgba(78,227,139,.15);
  }

  .no-map-data {
    min-height: 250px;
    border-radius: 14px;
    background: #10221a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #7e9989;
    text-align: center;
  }

  .no-map-data h3 {
    color: #dcece2;
    margin: 12px 0 5px;
  }

  .no-map-data p {
    margin: 0;
    font-size: 13px;
  }

  .location-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .location-box {
    background: #10251b;
    border-radius: 14px;
    padding: 17px;
    display: flex;
    gap: 13px;
    align-items: flex-start;
  }

  .location-icon {
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .location-icon.pickup {
    background: rgba(83,193,121,.12);
    color: #6ed798;
  }

  .location-icon.delivery {
    background: rgba(94,163,230,.12);
    color: #78b8ec;
  }

  .location-box span {
    display: block;
    color: #819b8c;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .location-box strong {
    font-size: 14px;
    line-height: 1.5;
  }

  .volunteer-info {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #10251b;
    padding: 17px;
    border-radius: 14px;
  }

  .volunteer-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #163c28;
    color: #6ed798;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .volunteer-info span {
    display: block;
    color: #819b8c;
    font-size: 12px;
    margin-bottom: 5px;
  }

  .volunteer-info strong {
    display: block;
  }

  .no-volunteer {
    display: flex;
    gap: 12px;
    align-items: center;
    background: #10251b;
    padding: 17px;
    border-radius: 14px;
    color: #829b8d;
  }

  .no-volunteer svg {
    color: #e2a45c;
  }

  .no-volunteer strong {
    color: #e8f2eb;
    display: block;
    margin-bottom: 4px;
  }

  .no-volunteer p {
    margin: 0;
    font-size: 13px;
  }

  .schedule-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .schedule-grid div {
    background: #10251b;
    padding: 16px;
    border-radius: 13px;
  }

  .delivery-completed-card {
    background: rgba(58,185,108,.09);
    border: 1px solid rgba(58,185,108,.25);
    border-radius: 18px;
    padding: 22px;
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .completed-icon {
    width: 50px;
    height: 50px;
    min-width: 50px;
    border-radius: 50%;
    background: #16472c;
    color: #72dfa0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delivery-completed-card h2 {
    margin: 0 0 5px;
    font-size: 18px;
  }

  .delivery-completed-card p {
    margin: 0;
    color: #91aa9a;
    font-size: 13px;
  }

  .ngo-tracking-loading,
  .tracking-error {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
  }

  .tracking-error svg {
    color: #f2a55b;
  }

  .tracking-error h2 {
    margin: 0;
  }

  .tracking-error p {
    color: #9db3a5;
  }

  .primary-action {
    border: none;
    background: #42c878;
    color: #06130c;
    padding: 12px 18px;
    border-radius: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .loading-spinner {
    width: 38px;
    height: 38px;
    border: 3px solid #234535;
    border-top-color: #55d58b;
    border-radius: 50%;
    animation: ngo-spin .8s linear infinite;
  }

  @keyframes ngo-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 800px) {
    .ngo-tracking-page {
      padding: 15px;
    }

    .tracking-header {
      flex-direction: column;
    }

    .tracking-food-card {
      grid-template-columns: 1fr;
    }

    .tracking-food-image,
    .tracking-image-placeholder,
    .tracking-food-image img {
      min-height: 220px;
    }

    .tracking-food-details,
    .location-grid,
    .schedule-grid {
      grid-template-columns: 1fr;
    }

    .tracking-map-wrapper {
      height: 330px;
    }
  }

  @media (max-width: 500px) {
    .tracking-topbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .tracking-header h1 {
      font-size: 26px;
    }

    .tracking-card,
    .tracking-food-info {
      padding: 18px;
    }
  }
`;

function getValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return null;
}

function formatDateTime(value) {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatQuantity(quantity, unit) {
  if (
    quantity === null ||
    quantity === undefined ||
    quantity === ''
  ) {
    return 'Quantity not available';
  }

  return `${quantity}${unit ? ` ${unit}` : ''}`;
}

function getStatusLabel(status) {
  if (!status) return 'Not available';

  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function normalizeAssignment(data) {
  if (!data) return null;

  return {
    assignmentId: getValue(
      data.assignment_id,
      data.assignmentId,
      data.id
    ),

    donationId: getValue(
      data.donation_id,
      data.donationId,
      data.donation?.donation_id,
      data.donation?.donationId
    ),

    ngoId: getValue(
      data.ngo_id,
      data.ngoId
    ),

    volunteerId: getValue(
      data.volunteer_id,
      data.volunteerId
    ),

    pickupLocation: getValue(
      data.pickup_location,
      data.pickupLocation
    ),

    deliveryLocation: getValue(
      data.delivery_location,
      data.deliveryLocation
    ),

    pickupTime: getValue(
      data.pickup_time,
      data.pickupTime
    ),

    deliveryTime: getValue(
      data.delivery_time,
      data.deliveryTime
    ),

    assignedAt: getValue(
      data.assigned_at,
      data.assignedAt
    ),

    status: getValue(
      data.status,
      data.assignment_status,
      data.assignmentStatus
    ),
  };
}

function normalizeDonation(
  data,
  assignment
) {
  const donation = data || {};

  return {
    donationId: getValue(
      donation.donation_id,
      donation.donationId,
      assignment?.donationId
    ),

    donorName: getValue(
      donation.donor_name,
      donation.donorName
    ),

    donorPhone: getValue(
      donation.donor_phone,
      donation.donorPhone
    ),

    foodName: getValue(
      donation.food_name,
      donation.foodName,
      'Food Donation'
    ),

    foodType: getValue(
      donation.food_type,
      donation.foodType
    ),

    quantity: getValue(
      donation.quantity
    ),

    unit: getValue(
      donation.unit
    ),

    expiryTime: getValue(
      donation.expiry_time,
      donation.expiryTime
    ),

    pickupStart: getValue(
      donation.pickup_start,
      donation.pickupStart
    ),

    pickupEnd: getValue(
      donation.pickup_end,
      donation.pickupEnd
    ),

    location: getValue(
      (assignment?.pickupLocation && assignment.pickupLocation !== 'Donor Location' && assignment.pickupLocation !== 'Pickup location') ? assignment.pickupLocation : null,
      donation.location,
      donation.pickup_address,
      donation.pickupAddress,
      assignment?.pickupLocation
    ),

    latitude: getValue(
      donation.latitude
    ),

    longitude: getValue(
      donation.longitude
    ),
  };
}

export default function NgoTracking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] =
    useState(null);

  const [donation, setDonation] =
    useState(null);

  const [tracking, setTracking] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    loadTracking();
  }, [id]);

  async function loadTracking() {
    try {
      setLoading(true);
      setError('');

      const assignmentResponse =
        await apiClient.get(
          `/api/assignments/${id}`
        );

      const normalizedAssignment =
        normalizeAssignment(
          assignmentResponse
        );

      if (!normalizedAssignment) {
        setError(
          'Delivery information not found.'
        );
        return;
      }

      setAssignment(
        normalizedAssignment
      );

      let donationResponse = null;

      if (
        normalizedAssignment.donationId
      ) {
        try {
          donationResponse =
            await apiClient.get(
              `/api/donations/${normalizedAssignment.donationId}`
            );
        } catch (err) {
          console.error(
            'Unable to load donation:',
            err
          );
        }
      }

      setDonation(
        normalizeDonation(
          donationResponse,
          normalizedAssignment
        )
      );

      /*
       * Tracking is optional.
       * If no tracking record exists,
       * the page still works.
       */

      try {
        const trackingResponse =
          await apiClient.get(
            `/api/assignments/${normalizedAssignment.assignmentId}/tracking`
          );

        setTracking(
          trackingResponse
        );
      } catch (err) {
        console.log(
          'No live tracking information available.'
        );

        setTracking(null);
      }

    } catch (err) {
      console.error(
        'Unable to load tracking:',
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to load delivery tracking.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="ngo-tracking-page">

          <div className="ngo-tracking-loading">

            <div className="loading-spinner" />

            <p>
              Loading delivery tracking...
            </p>

          </div>

        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>

        <div className="ngo-tracking-page">

          <div className="tracking-topbar">

            <button
              className="back-button"
              onClick={() =>
                navigate(
                  '/ngo/incoming-donations'
                )
              }
            >
              <ArrowLeft size={20} />
              Back
            </button>

          </div>

          <div className="tracking-error">

            <AlertCircle size={42} />

            <h2>
              Tracking unavailable
            </h2>

            <p>
              {error}
            </p>

            <button
              className="primary-action"
              onClick={() =>
                navigate(
                  '/ngo/incoming-donations'
                )
              }
            >
              Back to Deliveries
            </button>

          </div>

        </div>
      </>
    );
  }

  const status =
    assignment?.status || 'ASSIGNED';

  const pickupLocation =
    (assignment?.pickupLocation && assignment.pickupLocation !== 'Donor Location' && assignment.pickupLocation !== 'Pickup location')
      ? assignment.pickupLocation
      : donation?.location ||
        donation?.pickup_address ||
        donation?.pickupAddress ||
        assignment?.pickupLocation ||
        'Pickup location not available';

  const deliveryLocation =
    assignment?.deliveryLocation ||
    'Delivery location not available';

  const latitude = Number(
    donation?.latitude
  );

  const longitude = Number(
    donation?.longitude
  );

  const hasPickupCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const pickupPosition =
    hasPickupCoordinates
      ? {
          latitude,
          longitude,
        }
      : null;

  const trackingLatitude = Number(
    tracking?.latitude ??
      tracking?.current_latitude ??
      tracking?.currentLatitude ??
      tracking?.location?.latitude
  );

  const trackingLongitude = Number(
    tracking?.longitude ??
      tracking?.current_longitude ??
      tracking?.currentLongitude ??
      tracking?.location?.longitude
  );

  const hasTrackingCoordinates =
    Number.isFinite(
      trackingLatitude
    ) &&
    Number.isFinite(
      trackingLongitude
    );

  const livePosition =
    hasTrackingCoordinates
      ? {
          latitude: trackingLatitude,
          longitude: trackingLongitude,
        }
      : null;

  const currentPosition =
    livePosition || pickupPosition;

  const statusUpper =
    String(status).toUpperCase();

  const isDelivered =
    statusUpper === 'DELIVERED';

  const isPickedUp =
    statusUpper === 'PICKED_UP' ||
    statusUpper === 'IN_TRANSIT' ||
    isDelivered;

  const isInTransit =
    statusUpper === 'IN_TRANSIT' ||
    isDelivered;

  return (
    <>
      <style>{styles}</style>

      <div className="ngo-tracking-page">

        {/* TOP BAR */}

        <div className="tracking-topbar">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                `/ngo/delivery/${assignment.assignmentId}`
              )
            }
          >
            <ArrowLeft size={20} />
            Delivery Details
          </button>

          <div className="tracking-id">
            Delivery #{assignment.assignmentId}
          </div>

        </div>

        <main className="ngo-tracking-container">

          {/* HEADER */}

          <section className="tracking-header">

            <div>

              <span className="page-label">
                DELIVERY TRACKING
              </span>

              <h1>
                {donation?.foodName ||
                  'Food Donation'}
              </h1>

              <p>
                Track the current status of this delivery.
              </p>

            </div>

            <div className="tracking-status-badge">

              <CheckCircle size={18} />

              {getStatusLabel(status)}

            </div>

          </section>

          {/* FOOD CARD */}

          <section className="tracking-food-card">

            <div className="tracking-food-image">

              <img
                src={getFoodImage(donation)}
                alt={
                  donation?.foodName ||
                  'Food donation'
                }
                onError={(event) => {
                  if (
                    !event.currentTarget.src.includes(
                      'food-default.png'
                    )
                  ) {
                    event.currentTarget.src =
                      '/images/food-default.png';
                  }
                }}
              />

            </div>

            <div className="tracking-food-info">

              <span className="small-label">
                FOOD ITEM
              </span>

              <h2>
                {donation?.foodName ||
                  'Food Donation'}
              </h2>

              <div className="tracking-food-details">

                <div>
                  <span>
                    Quantity
                  </span>

                  <strong>
                    {formatQuantity(
                      donation?.quantity,
                      donation?.unit
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Food Type
                  </span>

                  <strong>
                    {donation?.foodType ||
                      'Not available'}
                  </strong>
                </div>

                <div>
                  <span>
                    Expiry
                  </span>

                  <strong>
                    {formatDateTime(
                      donation?.expiryTime
                    )}
                  </strong>
                </div>

              </div>

            </div>

          </section>

          {/* TIMELINE */}

          <section className="tracking-card">

            <div className="section-title">

              <Truck size={22} />

              <h2>
                Delivery Timeline
              </h2>

            </div>

            <div className="delivery-timeline">

              <TimelineItem
                completed
                icon={
                  <Package size={18} />
                }
                title="Donation Submitted"
                text="Food donation was submitted by the donor."
              />

              <TimelineItem
                completed
                icon={
                  <CheckCircle size={18} />
                }
                title="NGO Accepted"
                text="The donation was accepted for delivery."
              />

              <TimelineItem
                completed={Boolean(
                  assignment?.volunteerId
                )}
                icon={
                  <User size={18} />
                }
                title="Volunteer Assigned"
                text={
                  assignment?.volunteerId
                    ? `Volunteer #${assignment.volunteerId} is assigned.`
                    : 'Volunteer has not been assigned yet.'
                }
              />

              <TimelineItem
                completed={isPickedUp}
                icon={
                  <Package size={18} />
                }
                title="Picked Up"
                text={
                  isPickedUp
                    ? 'Food was picked up successfully.'
                    : 'Waiting for pickup.'
                }
              />

              <TimelineItem
                completed={isInTransit}
                icon={
                  <Navigation size={18} />
                }
                title="In Transit"
                text={
                  isInTransit
                    ? 'Delivery is on its way to the NGO.'
                    : 'Delivery is not currently in transit.'
                }
              />

              <TimelineItem
                completed={isDelivered}
                icon={
                  <CheckCircle size={18} />
                }
                title="Delivered"
                text={
                  isDelivered
                    ? 'Food has been delivered successfully.'
                    : 'Delivery has not been completed yet.'
                }
              />

            </div>

          </section>

          {/* MAP */}

          <section className="tracking-card">

            <div className="section-title">

              <MapPin size={22} />

              <h2>
                Delivery Map
              </h2>

            </div>

            {currentPosition ? (

              <div className="tracking-map-wrapper">

                <MapView
                  center={currentPosition}
                  pickupLocation={
                    pickupPosition
                  }
                  zoom={14}
                />

                {hasTrackingCoordinates && (
                  <div className="live-location-label">

                    <span className="live-dot" />

                    Live volunteer location available

                  </div>
                )}

              </div>

            ) : (

              <div className="no-map-data">

                <MapPin size={40} />

                <h3>
                  Location not available
                </h3>

                <p>
                  No valid coordinates are available
                  for this delivery.
                </p>

              </div>

            )}

          </section>

          {/* LOCATIONS */}

          <section className="tracking-card">

            <div className="section-title">

              <MapPin size={22} />

              <h2>
                Delivery Locations
              </h2>

            </div>

            <div className="location-grid">

              <div className="location-box">

                <div className="location-icon pickup">

                  <MapPin size={20} />

                </div>

                <div>

                  <span>
                    Pickup Location
                  </span>

                  <strong>
                    {pickupLocation}
                  </strong>

                </div>

              </div>

              <div className="location-box">

                <div className="location-icon delivery">

                  <Navigation size={20} />

                </div>

                <div>

                  <span>
                    Delivery Location
                  </span>

                  <strong>
                    {deliveryLocation}
                  </strong>

                </div>

              </div>

            </div>

          </section>

          {/* VOLUNTEER */}

          <section className="tracking-card">

            <div className="section-title">

              <User size={22} />

              <h2>
                Volunteer
              </h2>

            </div>

            {assignment?.volunteerId ? (

              <div className="volunteer-info">

                <div className="volunteer-avatar">

                  <User size={24} />

                </div>

                <div>

                  <span>
                    Assigned Volunteer
                  </span>

                  <strong>
                    Volunteer #
                    {assignment.volunteerId}
                  </strong>

                </div>

              </div>

            ) : (

              <div className="no-volunteer">

                <Clock size={24} />

                <div>

                  <strong>
                    Volunteer not assigned
                  </strong>

                  <p>
                    A volunteer has not been assigned
                    to this delivery yet.
                  </p>

                </div>

              </div>

            )}

          </section>

          {/* SCHEDULE */}

          <section className="tracking-card">

            <div className="section-title">

              <Clock size={22} />

              <h2>
                Delivery Schedule
              </h2>

            </div>

            <div className="schedule-grid">

              <div>

                <span>
                  Assigned At
                </span>

                <strong>
                  {formatDateTime(
                    assignment?.assignedAt
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Pickup Time
                </span>

                <strong>
                  {formatDateTime(
                    assignment?.pickupTime
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Delivery Time
                </span>

                <strong>
                  {formatDateTime(
                    assignment?.deliveryTime
                  )}
                </strong>

              </div>

            </div>

          </section>

          {/* COMPLETED */}

          {isDelivered && (

            <section className="delivery-completed-card">

              <div className="completed-icon">

                <CheckCircle size={30} />

              </div>

              <div>

                <h2>
                  Delivery Completed
                </h2>

                <p>
                  This food donation has been
                  successfully delivered to the NGO.
                </p>

              </div>

            </section>

          )}

        </main>

      </div>
    </>
  );
}

function TimelineItem({
  completed,
  icon,
  title,
  text,
}) {
  return (
    <div
      className={`timeline-item ${
        completed ? 'completed' : ''
      }`}
    >

      <div className="timeline-icon">
        {icon}
      </div>

      <div className="timeline-content">

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>

      </div>

    </div>
  );
}