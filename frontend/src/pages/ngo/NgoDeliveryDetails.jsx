import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  User,
  Phone,
  Truck,
  CheckCircle,
  Navigation,
  AlertCircle,
} from 'lucide-react';

import { apiClient } from '../../services/apiClient';
import { getFoodImage } from '../../utils/foodImages';

const styles = `
  .ngo-delivery-page {
    min-height: 100vh;
    background: #07140f;
    color: #f4faf6;
    padding: 24px;
    box-sizing: border-box;
  }

  .ngo-delivery-page * {
    box-sizing: border-box;
  }

  .ngo-delivery-topbar {
    max-width: 1200px;
    margin: 0 auto 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
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
    font-size: 14px;
  }

  .back-button:hover {
    background: #163025;
  }

  .delivery-id {
    color: #9fb8aa;
    font-size: 14px;
  }

  .ngo-delivery-container {
    max-width: 1200px;
    margin: auto;
  }

  .delivery-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 25px;
  }

  .page-label,
  .small-label {
    color: #73d49b;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.4px;
  }

  .delivery-header h1 {
    margin: 7px 0;
    font-size: 32px;
    color: #ffffff !important;
  }

  .delivery-header p {
    color: #9fb8aa;
    margin: 0;
  }

  .status-badge,
  .food-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 999px;
    background: rgba(68, 190, 117, .12);
    color: #76dfa0;
    border: 1px solid rgba(68, 190, 117, .22);
    font-size: 13px;
    font-weight: 700;
  }

  .food-main-card {
    background: #0c1d15;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 300px 1fr;
    margin-bottom: 20px;
  }

  .food-image-wrapper {
    min-height: 260px;
    background: #10261c;
    overflow: hidden;
  }

  .food-image {
    width: 100%;
    height: 100%;
    min-height: 260px;
    object-fit: cover;
    display: block;
  }

  .food-main-info {
    padding: 28px;
  }

  .food-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
  }

  .food-title-row h2 {
    margin: 7px 0 25px;
    font-size: 27px;
    color: #ffffff !important;
  }

  .food-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .summary-item {
    background: #11261c;
    border-radius: 14px;
    padding: 17px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .summary-item svg {
    color: #6ed798;
    flex-shrink: 0;
  }

  .summary-item span,
  .detail-item span {
    display: block;
    color: #819b8c;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .summary-item strong,
  .detail-item strong {
    color: #edf8f1;
    font-size: 14px;
  }

  .detail-card,
  .delivery-action-card {
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
    margin-bottom: 20px;
  }

  .section-title svg {
    color: #6ed798;
  }

  .section-title h2 {
    margin: 0;
    font-size: 18px;
    color: #ffffff !important;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .detail-item {
    background: #10251b;
    border-radius: 13px;
    padding: 16px;
  }

  .detail-item-wide {
    grid-column: 1 / -1;
  }

  .location-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .location-value svg {
    color: #6ed798;
  }

  .phone-link {
    color: #76dfa0;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 600;
  }

  .delivery-action-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .delivery-action-card h2 {
    margin: 0 0 7px;
    font-size: 19px;
    color: #ffffff !important;
  }

  .delivery-action-card p {
    margin: 0;
    color: #8fa99a;
    font-size: 14px;
  }

  .track-button,
  .primary-action {
    border: none;
    background: #42c878;
    color: #06130c;
    padding: 13px 19px;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .track-button:hover,
  .primary-action:hover {
    background: #5bd98e;
  }

  .ngo-delivery-loading,
  .ngo-delivery-error {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
  }

  .ngo-delivery-error {
    color: #b6c9bd;
  }

  .ngo-delivery-error svg {
    color: #f2a55b;
  }

  .ngo-delivery-error h2 {
    color: #fff;
    margin: 5px 0;
  }

  .ngo-delivery-error p {
    max-width: 500px;
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
    .ngo-delivery-page {
      padding: 15px;
    }

    .delivery-header {
      flex-direction: column;
    }

    .food-main-card {
      grid-template-columns: 1fr;
    }

    .food-image-wrapper,
    .food-image {
      min-height: 220px;
    }

    .food-summary-grid,
    .detail-grid {
      grid-template-columns: 1fr;
    }

    .detail-item-wide {
      grid-column: auto;
    }

    .delivery-action-card {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 500px) {
    .ngo-delivery-topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .food-title-row {
      flex-direction: column;
    }

    .food-main-info,
    .detail-card,
    .delivery-action-card {
      padding: 18px;
    }

    .delivery-header h1 {
      font-size: 26px;
    }
  }
`;

/* ------------------------------------------
   GET VALUE
------------------------------------------ */

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

/* ------------------------------------------
   FORMAT DATE
------------------------------------------ */

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/* ------------------------------------------
   FORMAT QUANTITY
------------------------------------------ */

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

/* ------------------------------------------
   STATUS
------------------------------------------ */

function getStatusLabel(status) {
  if (!status) {
    return 'Not available';
  }

  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* ------------------------------------------
   NORMALIZE ASSIGNMENT
------------------------------------------ */

function normalizeAssignment(data) {
  if (!data) {
    return null;
  }

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

    volunteerName: getValue(
      data.volunteer_name,
      data.volunteerName
    ),

    volunteerPhone: getValue(
      data.volunteer_phone,
      data.volunteerPhone
    ),

    volunteerEmail: getValue(
      data.volunteer_email,
      data.volunteerEmail
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

/* ------------------------------------------
   NORMALIZE DONATION
------------------------------------------ */

function normalizeDonation(
  data,
  assignment
) {
  const donation = data || {};

  return {
    donationId: getValue(
      donation.donation_id,
      donation.donationId,
      donation.id,
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
      donation.name,
      'Food Donation'
    ),

    foodType: getValue(
      donation.food_type,
      donation.foodType,
      donation.category
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

    imageUrl: getValue(
      donation.image_url,
      donation.imageUrl,
      donation.image
    ),
  };
}

/* ------------------------------------------
   MAIN COMPONENT
------------------------------------------ */

export default function NgoDeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] =
    useState(null);

  const [donation, setDonation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* ----------------------------------------
     LOAD DELIVERY
  ---------------------------------------- */

  useEffect(() => {
    loadDelivery();
  }, [id]);

  async function loadDelivery() {
    try {
      setLoading(true);
      setError('');

      /*
       * IMPORTANT:
       * id here is assignment ID,
       * not donation ID.
       */

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

      /*
       * Get the actual donation using
       * donationId from the assignment.
       */

      if (
        normalizedAssignment.donationId !==
          null &&
        normalizedAssignment.donationId !==
          undefined
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

    } catch (err) {
      console.error(
        'Unable to load delivery:',
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to load delivery details.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------
     OPEN TRACKING
  ---------------------------------------- */

  function openTracking() {
    if (!assignment?.assignmentId) {
      return;
    }

    navigate(
      `/ngo/tracking/${assignment.assignmentId}`
    );
  }

  /* ----------------------------------------
     LOADING
  ---------------------------------------- */

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="ngo-delivery-page">

          <div className="ngo-delivery-loading">

            <div className="loading-spinner" />

            <p>
              Loading delivery details...
            </p>

          </div>

        </div>
      </>
    );
  }

  /* ----------------------------------------
     ERROR
  ---------------------------------------- */

  if (error) {
    return (
      <>
        <style>{styles}</style>

        <div className="ngo-delivery-page">

          <div className="ngo-delivery-topbar">

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

          <div className="ngo-delivery-error">

            <AlertCircle size={42} />

            <h2>
              Delivery not found
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

  /* ----------------------------------------
     LOCATIONS
  ---------------------------------------- */

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

  /* ----------------------------------------
     PAGE
  ---------------------------------------- */

  return (
    <>
      <style>{styles}</style>

      <div className="ngo-delivery-page">

        {/* TOP BAR */}

        <div className="ngo-delivery-topbar">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                '/ngo/incoming-donations'
              )
            }
          >
            <ArrowLeft size={20} />
            Back to Deliveries
          </button>

          <div className="delivery-id">
            Delivery #{assignment?.assignmentId}
          </div>

        </div>

        <main className="ngo-delivery-container">

          {/* HEADER */}

          <section className="delivery-header">

            <div>

              <span className="page-label">
                FOOD DELIVERY
              </span>

              <h1>
                {donation?.foodName ||
                  'Food Donation'}
              </h1>

              <p>
                Complete information about this
                food delivery.
              </p>

            </div>

            <div className="status-badge">

              <CheckCircle size={18} />

              {getStatusLabel(
                assignment?.status
              )}

            </div>

          </section>

          {/* FOOD CARD */}

          <section className="food-main-card">

            {/* FOOD IMAGE */}

            <div className="food-image-wrapper">

              <img
                src={
                  getFoodImage(donation)
                }
                alt={
                  donation?.foodName ||
                  'Food donation'
                }
                className="food-image"
                onError={(event) => {

                  /*
                   * If category image cannot
                   * be loaded, use default image.
                   */

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

            {/* FOOD INFORMATION */}

            <div className="food-main-info">

              <div className="food-title-row">

                <div>

                  <span className="small-label">
                    FOOD ITEM
                  </span>

                  <h2>
                    {donation?.foodName ||
                      'Food Donation'}
                  </h2>

                </div>

                <span className="food-status">

                  {getStatusLabel(
                    assignment?.status
                  )}

                </span>

              </div>

              <div className="food-summary-grid">

                {/* QUANTITY */}

                <div className="summary-item">

                  <Package size={20} />

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

                </div>

                {/* FOOD TYPE */}

                <div className="summary-item">

                  <Package size={20} />

                  <div>

                    <span>
                      Food Type
                    </span>

                    <strong>
                      {donation?.foodType ||
                        'Not available'}
                    </strong>

                  </div>

                </div>

                {/* EXPIRY */}

                <div className="summary-item">

                  <Calendar size={20} />

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

            </div>

          </section>

          {/* DONOR INFORMATION */}

          <section className="detail-card">

            <div className="section-title">

              <User size={22} />

              <h2>
                Donor Information
              </h2>

            </div>

            <div className="detail-grid">

              <div className="detail-item">

                <span>
                  Donor Name
                </span>

                <strong>
                  {donation?.donorName ||
                    'Not available'}
                </strong>

              </div>

              <div className="detail-item">

                <span>
                  Phone
                </span>

                {donation?.donorPhone ? (

                  <a
                    href={`tel:${donation.donorPhone}`}
                    className="phone-link"
                  >

                    <Phone size={16} />

                    {donation.donorPhone}

                  </a>

                ) : (

                  <strong>
                    Not available
                  </strong>

                )}

              </div>

            </div>

          </section>

          {/* PICKUP INFORMATION */}

          <section className="detail-card">

            <div className="section-title">

              <MapPin size={22} />

              <h2>
                Pickup Information
              </h2>

            </div>

            <div className="detail-grid">

              <div className="detail-item detail-item-wide">

                <span>
                  Pickup Location
                </span>

                <strong className="location-value">

                  <MapPin size={17} />

                  {pickupLocation}

                </strong>

              </div>

              <div className="detail-item">

                <span>
                  Pickup Start
                </span>

                <strong>
                  {formatDateTime(
                    donation?.pickupStart
                  )}
                </strong>

              </div>

              <div className="detail-item">

                <span>
                  Pickup End
                </span>

                <strong>
                  {formatDateTime(
                    donation?.pickupEnd
                  )}
                </strong>

              </div>

            </div>

          </section>

          {/* DELIVERY INFORMATION */}

          <section className="detail-card">

            <div className="section-title">

              <Truck size={22} />

              <h2>
                Delivery Information
              </h2>

            </div>

            <div className="detail-grid">

              <div className="detail-item detail-item-wide">

                <span>
                  Delivery Location
                </span>

                <strong className="location-value">

                  <Navigation size={17} />

                  {deliveryLocation}

                </strong>

              </div>

              <div className="detail-item">

                <span>
                  Volunteer
                </span>

                <strong>
                  {assignment?.volunteerId
                    ? (assignment?.volunteerName || `Volunteer #${assignment.volunteerId}`)
                    : 'Not assigned'}
                </strong>

              </div>

              <div className="detail-item">

                <span>
                  Assigned At
                </span>

                <strong>
                  {formatDateTime(
                    assignment?.assignedAt
                  )}
                </strong>

              </div>

              <div className="detail-item">

                <span>
                  Pickup Time
                </span>

                <strong>
                  {formatDateTime(
                    assignment?.pickupTime
                  )}
                </strong>

              </div>

              <div className="detail-item">

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

          {/* VOLUNTEER INFORMATION */}

          <section className="detail-card">

            <div className="section-title">

              <User size={20} />

              <h2>
                Volunteer Information
              </h2>

            </div>

            {assignment?.volunteerId ? (
              <div className="detail-grid">

                <div className="detail-item">

                  <span>
                    Name
                  </span>

                  <strong>
                    {assignment?.volunteerName || `Volunteer #${assignment.volunteerId}`}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Phone
                  </span>

                  {assignment?.volunteerPhone ? (
                    <a
                      href={`tel:${assignment.volunteerPhone}`}
                      className="phone-link"
                    >
                      <Phone size={15} />
                      {assignment.volunteerPhone}
                    </a>
                  ) : (
                    <strong>Not specified</strong>
                  )}

                </div>

                <div className="detail-item detail-item-wide">

                  <span>
                    Email
                  </span>

                  <strong>
                    {assignment?.volunteerEmail || 'Not specified'}
                  </strong>

                </div>

              </div>
            ) : (
              <div className="detail-item detail-item-wide">

                <span>
                  Status
                </span>

                <strong>
                  Volunteer not yet assigned to this delivery
                </strong>

              </div>
            )}

          </section>

          {/* TRACK DELIVERY */}

          <section className="delivery-action-card">

            <div>

              <h2>
                Track this delivery
              </h2>

              <p>
                View the delivery timeline and
                available tracking information.
              </p>

            </div>

            <button
              className="track-button"
              onClick={openTracking}
            >

              <Navigation size={19} />

              Track Delivery

            </button>

          </section>

        </main>

      </div>
    </>
  );
}