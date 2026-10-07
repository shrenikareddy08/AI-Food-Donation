import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Package,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Navigation,
  Utensils,
  CalendarClock,
} from 'lucide-react';

import { donationService } from '../../services/donationService';
import { apiClient } from '../../services/apiClient';
import MapView from '../../components/MapView';
import { getFoodImage, getFoodCategoryImage } from '../../utils/foodImages';
import { useLocationContext } from '../../context/LocationContext';

function formatDateTime(value) {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function isExpired(value) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() <= Date.now();
}

function getValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

function getDistanceKm(
  latitude,
  longitude,
  targetLatitude,
  targetLongitude
) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    targetLatitude === null ||
    targetLatitude === undefined ||
    targetLongitude === null ||
    targetLongitude === undefined
  ) {
    return null;
  }

  const lat1 = Number(latitude);
  const lon1 = Number(longitude);
  const lat2 = Number(targetLatitude);
  const lon2 = Number(targetLongitude);

  if (
    Number.isNaN(lat1) ||
    Number.isNaN(lon1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2)
  ) {
    return null;
  }

  const earthRadius = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

function normalizeDonation(donation) {
  if (!donation) return null;

  const donor = donation.donor || {};

  const latitude =
    donation.latitude ??
    donation.pickup_latitude ??
    donation.pickupLatitude ??
    null;

  const longitude =
    donation.longitude ??
    donation.pickup_longitude ??
    donation.pickupLongitude ??
    null;

  const expiryTime =
    donation.expiry_time ??
    donation.expiryTime ??
    donation.available_until ??
    donation.availableUntil ??
    null;

  const donorName =
    donation.donor_name ??
    donation.donorName ??
    donor.full_name ??
    donor.fullName ??
    donor.name ??
    'Donor';

  const donorPhone =
    donation.donor_phone ??
    donation.donorPhone ??
    donor.phone_number ??
    donor.phoneNumber ??
    donor.phone ??
    donor.mobile ??
    '';

  const pickupAddress =
    (donation.location && String(donation.location).trim()) ||
    (donation.pickup_address && String(donation.pickup_address).trim()) ||
    (donation.pickupAddress && String(donation.pickupAddress).trim()) ||
    (donation.address && String(donation.address).trim()) ||
    (donation.donor_location && String(donation.donor_location).trim()) ||
    '—';

  const status =
    donation.status ??
    'POSTED';

  const expired = isExpired(expiryTime);

  const foodName =
    donation.food_name ??
    donation.name ??
    'Food Donation';

  const foodType =
    donation.food_type ??
    donation.foodType ??
    donation.category ??
    'Food';

  return {
    id:
      donation.donation_id ??
      donation.id ??
      donation.donationId,

    name: foodName,

    foodType,

    quantity:
      donation.quantity ??
      0,

    unit:
      donation.unit ??
      'kg',

    donorName,

    donorPhone,

    pickupAddress,

    latitude,

    longitude,

    availableUntil:
      expiryTime,

    distanceKm:
      donation.distance_km ??
      donation.distanceKm ??
      null,

    matchScore:
      donation.total_score ??
      donation.match_score ??
      donation.matchScore ??
      null,

    /*
      We intentionally use the category image
      instead of depending on backend image_url.
    */
    image: getFoodImage({
      name: foodName,
      foodType,
    }),

    status,

    expired,
  };
}

export default function FoodDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { location: userLocation } = useLocationContext() || {};
  const [ngoProfile, setNgoProfile] = useState(null);

  const [donation, setDonation] = useState(null);
  const [match, setMatch] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState('');

  const [currentTime, setCurrentTime] =
    useState(Date.now());

  useEffect(() => {
    apiClient.get('/api/ngos/me')
      .then((data) => setNgoProfile(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadFood();
  }, [id]);

  async function loadFood() {
    try {
      setLoading(true);
      setError('');

      const food =
        await donationService.getById(id);

      const normalized =
        normalizeDonation(food);

      if (!normalized) {
        throw new Error(
          'Food donation not found.'
        );
      }

      setDonation(normalized);

      try {
        const matches =
          await apiClient.get(
            '/api/matches/my'
          );

        const matchList =
          Array.isArray(matches)
            ? matches
            : matches?.items ||
              matches?.data ||
              [];

        const currentMatch =
          matchList.find(
            (item) =>
              Number(item.donation_id) ===
              Number(normalized.id)
          );

        setMatch(
          currentMatch || null
        );
      } catch {
        setMatch(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Food donation not found.'
      );
    } finally {
      setLoading(false);
    }
  }

  const expired = useMemo(() => {
    if (!donation?.availableUntil) {
      return false;
    }

    const expiry =
      new Date(
        donation.availableUntil
      );

    if (Number.isNaN(expiry.getTime())) {
      return false;
    }

    return expiry.getTime() <= currentTime;
  }, [
    donation,
    currentTime,
  ]);

  const calculatedDistance = useMemo(() => {
    if (donation?.distanceKm != null && !Number.isNaN(Number(donation.distanceKm))) {
      return Number(donation.distanceKm);
    }
    const ngoLat = ngoProfile?.latitude ?? userLocation?.latitude ?? 17.4435;
    const ngoLng = ngoProfile?.longitude ?? userLocation?.longitude ?? 78.3772;
    if (
      donation?.latitude != null &&
      donation?.longitude != null &&
      ngoLat != null &&
      ngoLng != null
    ) {
      return getDistanceKm(ngoLat, ngoLng, donation.latitude, donation.longitude);
    }
    return null;
  }, [donation, ngoProfile, userLocation]);

  async function handleMatchAction(status) {
    if (expired) {
      setError(
        'This food has expired and cannot be requested.'
      );
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      if (match?.match_id) {
        await apiClient.put(
          `/api/matches/${match.match_id}/status`,
          {
            status,
          }
        );
      } else if (status === 'ACCEPTED') {
        await apiClient.post(
          `/api/matches/claim/${id}`
        );
      }

      await loadFood();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to update the food request.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="food-details-page">
        <div className="food-details-loading">
          Loading food details...
        </div>
      </div>
    );
  }

  if (error && !donation) {
    return (
      <div className="food-details-page">
        <div className="food-details-error">

          <h2>
            Food donation not found
          </h2>

          <p>{error}</p>

          <button
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

        </div>
      </div>
    );
  }

  if (!donation) {
    return null;
  }

  const quantityText =
    `${Number(donation.quantity).toFixed(2)} ${
      donation.unit || 'kg'
    }`;

  const distance =
    calculatedDistance !== null && calculatedDistance !== undefined && !Number.isNaN(calculatedDistance)
      ? `${calculatedDistance.toFixed(1)} km`
      : '—';

  const pickupPosition =
    donation.latitude !== null &&
    donation.latitude !== undefined &&
    donation.longitude !== null &&
    donation.longitude !== undefined
      ? [
          Number(donation.latitude),
          Number(donation.longitude),
        ]
      : null;

  const matchStatus =
    match?.status?.toUpperCase();

  return (
    <div className="food-details-page">

      <div className="food-details-container">

        {/* TOP BAR */}

        <div className="food-details-topbar">

          <button
            className="back-icon-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </button>

          <div>

            <div className="topbar-label">
              NGO
            </div>

            <h1>
              Food Details
            </h1>

          </div>

        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="food-error-message">
            {error}
          </div>
        )}

        {/* MAIN CARD */}

        <div className="food-main-card">

          {/* IMAGE / HEADER */}

          <div className="food-image-section">

            <img
              src={donation.image}
              alt={donation.name}
              className="food-image"
              onError={(event) => {
                const defaultImage =
                  '/images/food-default.png';

                if (
                  !event.currentTarget.src.includes(
                    'food-default.png'
                  )
                ) {
                  event.currentTarget.src =
                    defaultImage;
                }
              }}
            />

            <div className="food-image-overlay" />

            <div className="food-header-content">

              <div className="food-category">
                {String(
                  donation.foodType
                ).toUpperCase()}
              </div>

              <h2>
                {donation.name}
              </h2>

              <div
                className={`food-status-badge ${
                  expired
                    ? 'expired'
                    : donation.status ===
                      'POSTED'
                    ? 'posted'
                    : ''
                }`}
              >
                {expired
                  ? 'EXPIRED'
                  : donation.status}
              </div>

            </div>

          </div>

          {/* FOOD INFORMATION */}

          <div className="food-content">

            <div className="food-info-grid">

              <div className="food-info-box">

                <div className="food-info-icon green">
                  <Package size={20} />
                </div>

                <div>

                  <span>
                    Quantity
                  </span>

                  <strong>
                    {quantityText}
                  </strong>

                </div>

              </div>

              <div className="food-info-box">

                <div className="food-info-icon blue">
                  <CalendarClock size={20} />
                </div>

                <div>

                  <span>
                    Available Until
                  </span>

                  <strong>
                    {formatDateTime(
                      donation.availableUntil
                    )}
                  </strong>

                </div>

              </div>

              <div className="food-info-box">

                <div className="food-info-icon orange">
                  <MapPin size={20} />
                </div>

                <div>

                  <span>
                    Pickup Location
                  </span>

                  <strong>
                    {donation.pickupAddress}
                  </strong>

                </div>

              </div>

              <div className="food-info-box">

                <div className="food-info-icon purple">
                  <Navigation size={20} />
                </div>

                <div>

                  <span>
                    Distance
                  </span>

                  <strong>
                    {distance}
                  </strong>

                </div>

              </div>

            </div>

            {/* EXPIRED MESSAGE */}

            {expired && (
              <div className="expired-box">

                <XCircle size={22} />

                <div>

                  <strong>
                    Food Expired
                  </strong>

                  <p>
                    This food is past its expiry
                    time and cannot be requested.
                  </p>

                </div>

              </div>
            )}

            {/* DONOR */}

            <div className="donor-card">

              <div className="section-title">
                <User size={20} />
                Donor Information
              </div>

              <div className="donor-content">

                <div className="donor-avatar">

                  {donation.donorName
                    ? donation.donorName
                        .charAt(0)
                        .toUpperCase()
                    : 'D'}

                </div>

                <div className="donor-details">

                  <strong>
                    {donation.donorName}
                  </strong>

                  {donation.donorPhone ? (
                    <div className="phone-row">

                      <Phone size={16} />

                      <span>
                        {donation.donorPhone}
                      </span>

                    </div>
                  ) : (
                    <span className="no-contact">
                      Contact information not
                      available
                    </span>
                  )}

                </div>

              </div>

            </div>

            {/* MAP */}

            <div className="map-card">

              <div className="map-header">

                <div>

                  <div className="section-title">
                    <MapPin size={20} />
                    Pickup Location
                  </div>

                  <p>
                    {donation.pickupAddress}
                  </p>

                </div>

              </div>

              <div className="map-container">

                {pickupPosition ? (
                  <MapView
                    center={{
                      latitude: Number(donation.latitude),
                      longitude: Number(donation.longitude),
                    }}
                    pickup={{
                      latitude: Number(donation.latitude),
                      longitude: Number(donation.longitude),
                      label: donation.pickupAddress,
                    }}
                    zoom={14}
                  />
                ) : (
                  <div className="no-map">

                    <MapPin size={30} />

                    <span>
                      Location not available
                    </span>

                  </div>
                )}

              </div>

            </div>

            {/* MATCH ACTIONS */}

            {(match || donation.status === 'POSTED') && (
              <div className="action-card">

                <div className="section-title">

                  <CheckCircle2 size={20} />

                  Food Request

                </div>

                {(matchStatus === 'ACCEPTED' || ['MATCHED', 'ASSIGNED', 'PICKUP_IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(donation.status)) &&
                  !expired && (
                    <>
                      <div className="accepted-message">

                        <CheckCircle2 size={20} />

                        <span>
                          This food request has been accepted. A volunteer delivery request is active!
                        </span>

                      </div>

                      <button
                        type="button"
                        style={{
                          marginTop: '12px',
                          width: '100%',
                          minHeight: '42px',
                          borderRadius: '10px',
                          border: '1px solid #22c55e',
                          background: 'rgba(34,197,94,0.1)',
                          color: '#4ade80',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                        onClick={() => navigate('/ngo/deliveries')}
                      >
                        View Active Deliveries
                      </button>
                    </>
                  )}

                {matchStatus ===
                  'REJECTED' && (
                    <div className="rejected-message">

                      <XCircle size={20} />

                      <span>
                        This food request was
                        rejected.
                      </span>

                    </div>
                  )}

                {expired && (
                  <button
                    className="expired-button"
                    disabled
                  >
                    EXPIRED
                  </button>
                )}

                {!expired &&
                  (!matchStatus ||
                    matchStatus ===
                      'PENDING') && (
                    <div className="action-buttons">

                      <button
                        className="accept-button"
                        disabled={
                          actionLoading
                        }
                        onClick={() =>
                          handleMatchAction(
                            'ACCEPTED'
                          )
                        }
                      >

                        <CheckCircle2
                          size={18}
                        />

                        {actionLoading
                          ? 'Processing...'
                          : 'Accept Food'}

                      </button>

                      <button
                        className="reject-button"
                        disabled={
                          actionLoading
                        }
                        onClick={() =>
                          handleMatchAction(
                            'REJECTED'
                          )
                        }
                      >

                        <XCircle size={18} />

                        Reject

                      </button>

                    </div>
                  )}

              </div>
            )}

          </div>

        </div>

      </div>

      <style>{`
        .food-details-page {
          min-height: 100vh;
          background: var(--color-bg, #f8fafc);
          color: var(--color-text, #0f172a);
          padding: 32px 20px 60px;
        }

        .food-details-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .food-details-topbar {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .back-icon-button {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-surface, #ffffff);
          color: var(--color-text, #0f172a);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
        }

        .back-icon-button:hover {
          background: var(--color-neutral-100, #f1f5f9);
        }

        .topbar-label {
          font-size: 11px;
          color: var(--color-primary-600, #16a34a);
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        .food-details-topbar h1 {
          margin: 2px 0 0;
          font-size: 26px;
          font-weight: 800;
          color: var(--color-text, #0f172a);
        }

        .food-main-card {
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .food-image-section {
          height: 300px;
          position: relative;
          overflow: hidden;
          background: #0f172a;
        }

        .food-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .food-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(15, 23, 42, 0.88),
            rgba(15, 23, 42, 0.15)
          );
        }

        .food-header-content {
          position: absolute;
          left: 28px;
          right: 28px;
          bottom: 25px;
        }

        .food-category {
          color: #86efac;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 7px;
        }

        .food-header-content h2 {
          margin: 0 0 12px;
          font-size: 34px;
          font-weight: 850;
          color: #ffffff;
        }

        .food-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(59,130,246,0.18);
          color: #2563eb;
          border: 1px solid rgba(96,165,250,0.25);
          font-size: 12px;
          font-weight: 700;
        }

        .food-status-badge.posted {
          background: rgba(22, 163, 74, 0.12);
          color: #16a34a;
          border-color: rgba(22, 163, 74, 0.25);
        }

        .food-status-badge.expired {
          background: rgba(239,68,68,0.12);
          color: #dc2626;
          border-color: rgba(239,68,68,0.25);
        }

        .food-content {
          padding: 26px;
        }

        .food-info-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 14px;
        }

        .food-info-box {
          min-height: 82px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 16px;
          background: var(--color-neutral-50, #f8fafc);
          border: 1px solid var(--color-border, #e2e8f0);
        }

        .food-info-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .food-info-icon.green {
          background: rgba(22, 163, 74, 0.12);
          color: #16a34a;
        }

        .food-info-icon.blue {
          background: rgba(59, 130, 246, 0.12);
          color: #2563eb;
        }

        .food-info-icon.orange {
          background: rgba(245, 158, 11, 0.12);
          color: #d97706;
        }

        .food-info-icon.purple {
          background: rgba(168, 85, 247, 0.12);
          color: #9333ea;
        }

        .food-info-box span {
          display: block;
          color: var(--color-text-tertiary, #94a3b8);
          font-size: 12px;
          margin-bottom: 5px;
        }

        .food-info-box strong {
          display: block;
          color: var(--color-text, #0f172a);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.35;
        }

        .expired-box {
          margin-top: 18px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.20);
          color: #dc2626;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .expired-box strong {
          display: block;
          color: #dc2626;
          margin-bottom: 4px;
        }

        .expired-box p {
          margin: 0;
          color: var(--color-text-secondary, #64748b);
          font-size: 13px;
        }

        .donor-card,
        .map-card,
        .action-card {
          margin-top: 18px;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .donor-card {
          padding: 20px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--color-text, #0f172a);
          font-size: 15px;
          font-weight: 750;
        }

        .section-title svg {
          color: var(--color-primary-600, #16a34a);
        }

        .donor-content {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 18px;
        }

        .donor-avatar {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 50%;
          background: var(--color-primary-100, #dcfce7);
          color: var(--color-primary-700, #15803d);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
        }

        .donor-details strong {
          display: block;
          font-size: 16px;
          color: var(--color-text, #0f172a);
          margin-bottom: 5px;
        }

        .phone-row {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--color-text-secondary, #64748b);
          font-size: 13px;
        }

        .no-contact {
          color: var(--color-text-tertiary, #94a3b8);
          font-size: 13px;
        }

        .map-header {
          padding: 18px 20px;
        }

        .map-header p {
          margin: 7px 0 0 29px;
          color: var(--color-text-secondary, #64748b);
          font-size: 13px;
        }

        .map-container {
          height: 350px;
          width: 100%;
          overflow: hidden;
          background: #f1f5f9;
        }

        .map-container > * {
          width: 100%;
          height: 100%;
        }

        .no-map {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--color-text-tertiary, #94a3b8);
        }

        .action-card {
          padding: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 18px;
        }

        .accept-button,
        .reject-button,
        .expired-button {
          min-height: 46px;
          border-radius: 12px;
          border: none;
          padding: 0 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .accept-button {
          flex: 1;
          background: var(--color-primary-600, #16a34a);
          color: #ffffff;
        }

        .accept-button:hover {
          background: var(--color-primary-700, #15803d);
        }

        .reject-button {
          flex: 1;
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.22);
        }

        .reject-button:hover {
          background: rgba(239, 68, 68, 0.16);
        }

        .expired-button {
          width: 100%;
          margin-top: 18px;
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.22);
          cursor: not-allowed;
        }

        .accepted-message,
        .rejected-message {
          margin-top: 16px;
          padding: 14px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
        }

        .accepted-message {
          background: var(--color-primary-50, #f0fdf4);
          border: 1px solid var(--color-primary-200, #bbf7d0);
          color: var(--color-primary-700, #15803d);
        }

        .rejected-message {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.20);
          color: #dc2626;
        }

        .food-error-message {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.20);
          color: #dc2626;
        }

        .food-details-loading,
        .food-details-error {
          max-width: 700px;
          margin: 100px auto;
          padding: 30px;
          text-align: center;
          border-radius: 18px;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: var(--shadow-sm);
        }

        .food-details-error h2 {
          margin-top: 0;
          color: var(--color-text, #0f172a);
        }

        .food-details-error p {
          color: var(--color-text-secondary, #64748b);
        }

        .back-button {
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 16px;
          border: none;
          border-radius: 10px;
          background: var(--color-primary-600, #16a34a);
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 700px) {
          .food-details-page {
            padding: 20px 12px 40px;
          }

          .food-content {
            padding: 16px;
          }

          .food-info-grid {
            grid-template-columns: 1fr;
          }

          .food-image-section {
            height: 250px;
          }

          .food-header-content h2 {
            font-size: 27px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .map-container {
            height: 280px;
          }
        }
      `}</style>
    </div>
  );
}