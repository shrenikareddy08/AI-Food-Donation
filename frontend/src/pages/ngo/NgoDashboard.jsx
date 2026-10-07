import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  MapPin,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

import { apiClient } from '../../services/apiClient';
import { getFoodImage } from '../../utils/foodImages';

/* ------------------------------------------
   CHECK EXPIRY
------------------------------------------ */

function isExpired(expiryTime) {
  if (!expiryTime) return false;

  const date = new Date(expiryTime);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() <= Date.now();
}

/* ------------------------------------------
   FORMAT EXPIRY
------------------------------------------ */

function formatExpiry(expiryTime) {
  if (!expiryTime) {
    return 'Expiry not available';
  }

  const date = new Date(expiryTime);

  if (Number.isNaN(date.getTime())) {
    return 'Expiry not available';
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

/* ------------------------------------------
   NORMALIZE DONATION
------------------------------------------ */

function normalizeDonation(donation) {
  const expiryTime =
    donation?.expiry_time ??
    donation?.expiryTime ??
    donation?.available_until ??
    donation?.availableUntil ??
    null;

  return {
    id:
      donation?.donation_id ??
      donation?.id ??
      donation?.donationId,

    name:
      donation?.food_name ??
      donation?.name ??
      'Food Donation',

    foodType:
      donation?.food_type ??
      donation?.foodType ??
      donation?.category ??
      'Food',

    quantity:
      donation?.quantity ?? 0,

    unit:
      donation?.unit ?? 'kg',

    location:
      donation?.location ??
      donation?.pickup_address ??
      donation?.pickupAddress ??
      'Pickup location',

    expiryTime,

    status:
      donation?.status ??
      'POSTED',

    expired:
      isExpired(expiryTime),

    image_url:
      donation?.image_url ??
      donation?.image ??
      null,
  };
}

/* ------------------------------------------
   NGO DASHBOARD
------------------------------------------ */

export default function NgoDashboard() {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentTime, setCurrentTime] =
    useState(Date.now());

  /* ----------------------------------------
     UPDATE CURRENT TIME
  ---------------------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  /* ----------------------------------------
     LOAD FOOD
  ---------------------------------------- */

  useEffect(() => {
    loadFoods();
  }, []);

  async function loadFoods() {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.get(
        '/api/matches/available'
      );

      const list = Array.isArray(response)
        ? response
        : response?.items ??
          response?.data ??
          [];

      const normalized = list
        .map(normalizeDonation)
        .filter(
          (food) =>
            food.id !== undefined &&
            food.id !== null
        );

      setFoods(normalized);
    } catch (err) {
      console.error(
        'Unable to load available food:',
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to load available food.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------
     FOOD CLICK
  ---------------------------------------- */

  function handleFoodClick(food) {
    if (food.expired) {
      return;
    }

    navigate(`/ngo/food/${food.id}`);
  }

  /* ----------------------------------------
     LOADING
  ---------------------------------------- */

  if (loading) {
    return (
      <div className="ngo-dashboard-page">
        <div className="ngo-dashboard-loading">
          Loading available food...
        </div>

        <style>{`
          .ngo-dashboard-page {
            min-height: 100vh;
            background: var(--color-bg, #f8fafc);
            color: var(--color-text, #0f172a);
          }

          .ngo-dashboard-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text-secondary, #64748b);
            font-size: 15px;
          }
        `}</style>
      </div>
    );
  }

  /* ----------------------------------------
     PAGE
  ---------------------------------------- */

  return (
    <div className="ngo-dashboard-page">

      <div className="ngo-dashboard-container">

        {/* HEADER */}

        <div className="ngo-dashboard-header">

          <div>

            <div className="ngo-dashboard-label">
              NGO DASHBOARD
            </div>

            <h1>
              Available Food
            </h1>

            <p>
              Find food donations available
              for your NGO.
            </p>

          </div>

          <div className="food-count">
            {foods.length} Food
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="ngo-dashboard-error">

            <AlertCircle size={19} />

            <span>
              {error}
            </span>

          </div>
        )}

        {/* FOOD LIST */}

        {foods.length === 0 ? (

          <div className="empty-food">

            <Package size={40} />

            <h3>
              No food available
            </h3>

            <p>
              There are currently no food
              donations available.
            </p>

          </div>

        ) : (

          <div className="food-grid">

            {foods.map((food) => {

              const expired =
                food.expiryTime &&
                new Date(
                  food.expiryTime
                ).getTime() <= currentTime;

              return (

                <div
                  key={food.id}
                  className={`food-dashboard-card ${
                    expired
                      ? 'food-expired'
                      : ''
                  }`}
                >

                  {/* IMAGE */}

                  <div className="dashboard-food-image">

                    <img
                      src={getFoodImage(food)}
                      alt={
                        food.name ||
                        'Food donation'
                      }
                      onError={(event) => {

                        /*
                         * Prevent infinite
                         * image fallback loop.
                         */

                        const defaultImage =
                          '/images/food-default.png';

                        if (
                          event.currentTarget.src.endsWith(
                            'food-default.png'
                          )
                        ) {
                          return;
                        }

                        event.currentTarget.src =
                          defaultImage;
                      }}
                    />

                    <div
                      className={`dashboard-status ${
                        expired
                          ? 'expired-status'
                          : 'available-status'
                      }`}
                    >
                      {expired
                        ? 'EXPIRED'
                        : 'AVAILABLE'}
                    </div>

                  </div>

                  {/* CONTENT */}

                  <div className="dashboard-food-content">

                    <div className="dashboard-food-category">
                      {String(
                        food.foodType || 'Food'
                      ).toUpperCase()}
                    </div>

                    <h2>
                      {food.name}
                    </h2>

                    <div className="dashboard-food-details">

                      {/* QUANTITY */}

                      <div className="dashboard-detail">

                        <Package size={16} />

                        <span>
                          {Number(
                            food.quantity || 0
                          ).toFixed(2)}{' '}
                          {food.unit || 'kg'}
                        </span>

                      </div>

                      {/* LOCATION */}

                      <div className="dashboard-detail">

                        <MapPin size={16} />

                        <span>
                          {food.location ||
                            'Pickup location'}
                        </span>

                      </div>

                      {/* EXPIRY */}

                      <div className="dashboard-detail">

                        <Clock size={16} />

                        <span>
                          {expired
                            ? `Expired on ${formatExpiry(
                                food.expiryTime
                              )}`
                            : `Available until ${formatExpiry(
                                food.expiryTime
                              )}`}
                        </span>

                      </div>

                    </div>

                    {/* BUTTON */}

                    {expired ? (

                      <button
                        className="expired-food-button"
                        disabled
                      >

                        <AlertCircle size={17} />

                        EXPIRED

                      </button>

                    ) : (

                      <button
                        className="request-food-button"
                        onClick={() =>
                          handleFoodClick(food)
                        }
                      >

                        REQUEST FOOD

                        <ArrowRight size={17} />

                      </button>

                    )}

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

      {/* ------------------------------------
          STYLES
      ------------------------------------ */}

      <style>{`

        .ngo-dashboard-page {
          min-height: calc(100vh - 64px);
          background: #f8fafc;
          color: #0f172a;
          padding: 32px 24px 64px;
        }

        .ngo-dashboard-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .ngo-dashboard-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .ngo-dashboard-label {
          color: #16a34a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .ngo-dashboard-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .ngo-dashboard-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .food-count {
          padding: 8px 16px;
          border-radius: 999px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ngo-dashboard-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          margin-bottom: 24px;
          border-radius: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 14px;
        }

        /* Consistent grid: 3 columns on desktop, 2 on tablet, 1 on mobile */
        .food-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          align-items: stretch;
        }

        /* Card: consistent height in row, clean borders and soft shadow */
        .food-dashboard-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .food-dashboard-card:hover {
          transform: translateY(-3px);
          border-color: #86efac;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        }

        .food-dashboard-card.food-expired {
          opacity: 0.75;
          border-color: #fecaca;
        }

        /* Fixed image area: strict 180px height, never alters card dimension */
        .dashboard-food-image {
          position: relative;
          width: 100%;
          height: 180px;
          min-height: 180px;
          max-height: 180px;
          background: #f1f5f9;
          overflow: hidden;
          flex-shrink: 0;
        }

        .dashboard-food-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .dashboard-status {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .available-status {
          background: #16a34a;
          color: #ffffff;
        }

        .expired-status {
          background: #dc2626;
          color: #ffffff;
        }

        /* Card Content Area with flex: 1 and margin-top: auto for buttons */
        .dashboard-food-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 20px;
          gap: 12px;
        }

        .dashboard-food-category {
          color: #16a34a;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .dashboard-food-content h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.35;
        }

        .dashboard-food-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
          margin-bottom: 8px;
        }

        .dashboard-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.4;
        }

        .dashboard-detail svg {
          min-width: 16px;
          color: #94a3b8;
          flex-shrink: 0;
        }

        /* Consistent button at the bottom of the card */
        .request-food-button,
        .expired-food-button {
          margin-top: auto;
          width: 100%;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          transition: background 0.2s ease, transform 0.1s ease;
        }

        .request-food-button {
          border: none;
          background: #16a34a;
          color: #ffffff;
          cursor: pointer;
        }

        .request-food-button:hover {
          background: #15803d;
        }

        .expired-food-button {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #dc2626;
          cursor: not-allowed;
        }

        .empty-food {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 32px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .empty-food h3 {
          color: #0f172a;
          margin: 14px 0 6px;
          font-size: 18px;
          font-weight: 700;
        }

        .empty-food p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 950px) {
          .food-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 650px) {
          .ngo-dashboard-page {
            padding: 20px 16px 40px;
          }

          .ngo-dashboard-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .ngo-dashboard-header h1 {
            font-size: 24px;
          }

          .food-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

      `}</style>

    </div>
  );
}