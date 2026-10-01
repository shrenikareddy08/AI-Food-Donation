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
   GET FOOD IMAGE
------------------------------------------ */

function getFoodImage(food) {
  /*
   * If donor uploaded an actual image,
   * use that image first.
   */
  if (food?.image_url) {
    return food.image_url;
  }

  /*
   * Check both food type and food name.
   * This handles values such as:
   * Fruits
   * Fresh Fruits
   * Fresh Fruit
   * Fruit Basket
   * Vegetables
   * Cooked Food
   * Rice
   */
  const foodType = String(
    food?.foodType ||
      food?.food_type ||
      food?.category ||
      ''
  ).toLowerCase();

  const foodName = String(
    food?.name ||
      food?.food_name ||
      ''
  ).toLowerCase();

  const combinedText = `${foodType} ${foodName}`;

  /* VEGETABLES */

  if (
    combinedText.includes('vegetable') ||
    combinedText.includes('veggie')
  ) {
    return '/images/vegetables.png';
  }

  /* FRUITS */

  if (
    combinedText.includes('fruit') ||
    combinedText.includes('fruits')
  ) {
    return '/images/fruits.png';
  }

  /* COOKED FOOD */

  if (
    combinedText.includes('cooked') ||
    combinedText.includes('meal') ||
    combinedText.includes('meals') ||
    combinedText.includes('food')
  ) {
    return '/images/cooked-food.png';
  }

  /* RICE / GRAINS */

  if (
    combinedText.includes('rice') ||
    combinedText.includes('grain') ||
    combinedText.includes('grains')
  ) {
    return '/images/rice.png';
  }

  /* DEFAULT */

  return '/images/food-default.png';
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
            background: #050505;
            color: #ffffff;
          }

          .ngo-dashboard-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
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
          min-height: 100vh;
          background: #050505;
          color: #ffffff;
          padding: 32px 20px 60px;
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
        }

        .ngo-dashboard-label {
          color: #4ade80;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.6px;
          margin-bottom: 6px;
        }

        .ngo-dashboard-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 850;
        }

        .ngo-dashboard-header p {
          margin: 7px 0 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .food-count {
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.10);
          border: 1px solid rgba(34, 197, 94, 0.20);
          color: #86efac;
          font-size: 13px;
          font-weight: 750;
        }

        .ngo-dashboard-error {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 14px 16px;
          margin-bottom: 20px;
          border-radius: 13px;
          background: rgba(239, 68, 68, 0.09);
          border: 1px solid rgba(239, 68, 68, 0.18);
          color: #fca5a5;
        }

        .food-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .food-dashboard-card {
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.09);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .food-dashboard-card:hover {
          transform: translateY(-3px);
          border-color:
            rgba(74, 222, 128, 0.30);
        }

        .food-dashboard-card.food-expired {
          opacity: 0.72;
          border-color:
            rgba(239, 68, 68, 0.18);
        }

        .dashboard-food-image {
          height: 190px;
          position: relative;
          background: #111827;
          overflow: hidden;
        }

        .dashboard-food-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .dashboard-status {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 850;
          backdrop-filter: blur(10px);
        }

        .available-status {
          background:
            rgba(34, 197, 94, 0.17);
          color: #86efac;
          border:
            1px solid rgba(34, 197, 94, 0.25);
        }

        .expired-status {
          background:
            rgba(239, 68, 68, 0.18);
          color: #fca5a5;
          border:
            1px solid rgba(239, 68, 68, 0.25);
        }

        .dashboard-food-content {
          padding: 18px;
        }

        .dashboard-food-category {
          color: #4ade80;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.3px;
          margin-bottom: 6px;
        }

        .dashboard-food-content h2 {
          margin: 0 0 16px;
          font-size: 20px;
          font-weight: 800;
        }

        .dashboard-food-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }

        .dashboard-detail {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.4;
        }

        .dashboard-detail svg {
          min-width: 16px;
          margin-top: 1px;
          color: #64748b;
        }

        .request-food-button,
        .expired-food-button {
          width: 100%;
          min-height: 44px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
        }

        .request-food-button {
          border: none;
          background: #22c55e;
          color: #052e16;
          cursor: pointer;
        }

        .request-food-button:hover {
          background: #4ade80;
        }

        .expired-food-button {
          border:
            1px solid rgba(239, 68, 68, 0.22);
          background:
            rgba(239, 68, 68, 0.08);
          color: #fca5a5;
          cursor: not-allowed;
        }

        .empty-food {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 20px;
          background:
            rgba(255, 255, 255, 0.035);
          border:
            1px solid rgba(255, 255, 255, 0.08);
          color: #64748b;
        }

        .empty-food h3 {
          color: #ffffff;
          margin: 14px 0 5px;
        }

        .empty-food p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 950px) {

          .food-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 650px) {

          .ngo-dashboard-page {
            padding: 20px 12px 40px;
          }

          .ngo-dashboard-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .ngo-dashboard-header h1 {
            font-size: 27px;
          }

          .food-grid {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>
  );
}