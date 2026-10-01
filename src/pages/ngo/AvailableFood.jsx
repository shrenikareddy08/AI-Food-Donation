import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  MapPin,
  ArrowRight,
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
   * If the donor uploaded a real image,
   * use that image.
   */
  if (food?.image_url) {
    return food.image_url;
  }

  /*
   * IMPORTANT:
   * normalizeDonation() creates foodType,
   * so we check food.foodType here.
   */
  const type = (
    food?.foodType ||
    food?.name ||
    ''
  ).toLowerCase();

  /* VEGETABLES */
  if (
    type.includes('vegetable') ||
    type.includes('vegetables')
  ) {
    return '/images/vegetables.png';
  }

  /* COOKED FOOD / MEALS */
  if (
    type.includes('cooked') ||
    type.includes('meal') ||
    type.includes('meals')
  ) {
    return '/images/cooked-food.png';
  }

  /* FRUITS */
  if (
    type.includes('fruit') ||
    type.includes('fruits')
  ) {
    return '/images/fruits.png';
  }

  /* RICE / GRAINS */
  if (
    type.includes('rice') ||
    type.includes('grain') ||
    type.includes('grains')
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
  return {
    id:
      donation.donation_id ??
      donation.id ??
      donation.donationId,

    name:
      donation.food_name ??
      donation.name ??
      'Food Donation',

    foodType:
      donation.food_type ??
      donation.category ??
      'Food',

    quantity:
      donation.quantity ?? 0,

    unit:
      donation.unit ?? 'kg',

    location:
      donation.location ??
      donation.pickup_address ??
      donation.pickupAddress ??
      'Pickup location',

    expiryTime:
      donation.expiry_time ??
      donation.expiryTime ??
      donation.available_until ??
      donation.availableUntil ??
      null,

    /*
     * Keep the original image_url field name
     * so getFoodImage() can use it.
     */
    image_url:
      donation.image_url ??
      donation.image ??
      null,

    donor:
      donation.donor_name ??
      donation.donorName ??
      'Donor',

    donorPhone:
      donation.donor_phone ??
      donation.donorPhone ??
      '',
  };
}

/* ------------------------------------------
   AVAILABLE FOOD PAGE
------------------------------------------ */

export default function AvailableFood() {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ----------------------------------------
     LOAD AVAILABLE FOOD
  ---------------------------------------- */

  useEffect(() => {
    loadAvailableFood();
  }, []);

  async function loadAvailableFood() {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.get(
        '/api/matches/available'
      );

      const list = Array.isArray(response)
        ? response
        : response?.items ||
          response?.data ||
          [];

      /*
       * Convert backend data into
       * frontend format.
       */
      const normalizedFoods = list
        .map(normalizeDonation)
        .filter(
          (food) =>
            food.id !== undefined &&
            food.id !== null
        );

      /*
       * Remove expired food.
       */
      const availableFoods =
        normalizedFoods.filter(
          (food) =>
            !isExpired(food.expiryTime)
        );

      setFoods(availableFoods);

    } catch (err) {
      console.error(err);

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
     REQUEST FOOD
  ---------------------------------------- */

  function handleRequestFood(food) {
    /*
     * Do not allow expired food.
     */
    if (isExpired(food.expiryTime)) {
      return;
    }

    navigate(`/ngo/food/${food.id}`);
  }

  /* ----------------------------------------
     LOADING
  ---------------------------------------- */

  if (loading) {
    return (
      <div className="available-food-page">

        <div className="available-food-loading">
          Loading available food...
        </div>

      </div>
    );
  }

  /* ----------------------------------------
     PAGE
  ---------------------------------------- */

  return (
    <div className="available-food-page">

      <div className="available-food-container">

        {/* HEADER */}

        <div className="available-food-header">

          <div>

            <div className="available-food-label">
              NGO
            </div>

            <h1>
              Available Food
            </h1>

            <p>
              Food donations that are currently
              available for your NGO.
            </p>

          </div>

          <div className="food-count">
            {foods.length} Available
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="available-food-error">
            {error}
          </div>
        )}

        {/* FOOD LIST */}

        {foods.length === 0 ? (

          <div className="no-food-card">

            <Package size={42} />

            <h2>
              No food available
            </h2>

            <p>
              There are currently no non-expired
              food donations available.
            </p>

          </div>

        ) : (

          <div className="available-food-grid">

            {foods.map((food) => (

              <div
                className="available-food-card"
                key={food.id}
              >

                {/* IMAGE */}

                <div className="available-food-image">

                  <img
                    src={getFoodImage(food)}
                    alt={
                      food.name ||
                      'Food donation'
                    }
                    onError={(event) => {
                      /*
                       * If an image cannot be loaded,
                       * use the default image.
                       */
                      if (
                        event.currentTarget.src.includes(
                          'food-default.png'
                        )
                      ) {
                        return;
                      }

                      event.currentTarget.src =
                        '/images/food-default.png';
                    }}
                  />

                  <div className="available-badge">
                    AVAILABLE
                  </div>

                </div>

                {/* CONTENT */}

                <div className="available-food-content">

                  <div className="food-category">
                    {String(
                      food.foodType
                    ).toUpperCase()}
                  </div>

                  <h2>
                    {food.name}
                  </h2>

                  <div className="food-details">

                    {/* QUANTITY */}

                    <div className="food-detail-row">

                      <Package size={16} />

                      <span>
                        {Number(
                          food.quantity
                        ).toFixed(2)}{' '}
                        {food.unit}
                      </span>

                    </div>

                    {/* LOCATION */}

                    <div className="food-detail-row">

                      <MapPin size={16} />

                      <span>
                        {food.location}
                      </span>

                    </div>

                    {/* EXPIRY */}

                    <div className="food-detail-row">

                      <Clock size={16} />

                      <span>
                        Available until{' '}
                        {formatExpiry(
                          food.expiryTime
                        )}
                      </span>

                    </div>

                  </div>

                  {/* REQUEST BUTTON */}

                  <button
                    className="request-food-button"
                    onClick={() =>
                      handleRequestFood(food)
                    }
                  >

                    REQUEST FOOD

                    <ArrowRight size={17} />

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ------------------------------------
          STYLES
      ------------------------------------ */}

      <style>{`

        .available-food-page {
          min-height: 100vh;
          background: #050505;
          color: #ffffff;
          padding: 32px 20px 60px;
        }

        .available-food-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .available-food-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .available-food-label {
          color: #4ade80;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .available-food-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 850;
        }

        .available-food-header p {
          margin: 7px 0 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .food-count {
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(34,197,94,0.10);
          border: 1px solid rgba(34,197,94,0.20);
          color: #86efac;
          font-size: 13px;
          font-weight: 750;
          white-space: nowrap;
        }

        .available-food-error {
          padding: 14px 16px;
          margin-bottom: 20px;
          border-radius: 13px;
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.18);
          color: #fca5a5;
        }

        .available-food-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .available-food-card {
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.09);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .available-food-card:hover {
          transform: translateY(-3px);
          border-color:
            rgba(74,222,128,0.30);
        }

        .available-food-image {
          height: 190px;
          position: relative;
          overflow: hidden;
          background: #111827;
        }

        .available-food-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .available-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 6px 10px;
          border-radius: 999px;
          background:
            rgba(34,197,94,0.17);
          color: #86efac;
          border:
            1px solid rgba(34,197,94,0.25);
          font-size: 10px;
          font-weight: 850;
        }

        .available-food-content {
          padding: 18px;
        }

        .food-category {
          color: #4ade80;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.3px;
          margin-bottom: 6px;
        }

        .available-food-content h2 {
          margin: 0 0 16px;
          font-size: 20px;
          font-weight: 800;
        }

        .food-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }

        .food-detail-row {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.4;
        }

        .food-detail-row svg {
          min-width: 16px;
          margin-top: 1px;
          color: #64748b;
        }

        .request-food-button {
          width: 100%;
          min-height: 44px;
          border: none;
          border-radius: 11px;
          background: #22c55e;
          color: #052e16;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .request-food-button:hover {
          background: #4ade80;
        }

        .no-food-card {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 20px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.08);
          color: #64748b;
        }

        .no-food-card h2 {
          margin: 14px 0 5px;
          color: #ffffff;
          font-size: 20px;
        }

        .no-food-card p {
          margin: 0;
          font-size: 14px;
        }

        .available-food-loading {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        @media (max-width: 950px) {

          .available-food-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 650px) {

          .available-food-page {
            padding: 20px 12px 40px;
          }

          .available-food-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .available-food-header h1 {
            font-size: 27px;
          }

          .available-food-grid {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>
  );
}