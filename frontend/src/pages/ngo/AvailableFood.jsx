import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  MapPin,
  ArrowRight,
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
          min-height: calc(100vh - 64px);
          background: #f8fafc;
          color: #0f172a;
          padding: 32px 24px 64px;
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
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .available-food-label {
          color: #16a34a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .available-food-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .available-food-header p {
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
          font-weight: 750;
          white-space: nowrap;
        }

        .available-food-error {
          padding: 14px 16px;
          margin-bottom: 24px;
          border-radius: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 14px;
        }

        .available-food-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          align-items: stretch;
        }

        .available-food-card {
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

        .available-food-card:hover {
          transform: translateY(-3px);
          border-color: #86efac;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        }

        .available-food-image {
          position: relative;
          width: 100%;
          height: 180px;
          min-height: 180px;
          max-height: 180px;
          background: #f1f5f9;
          overflow: hidden;
          flex-shrink: 0;
        }

        .available-food-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .available-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #16a34a;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .available-food-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 20px;
          gap: 12px;
        }

        .food-category {
          color: #16a34a;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .available-food-content h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.35;
        }

        .food-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
          margin-bottom: 8px;
        }

        .food-detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.4;
        }

        .food-detail-row svg {
          min-width: 16px;
          color: #94a3b8;
          flex-shrink: 0;
        }

        .request-food-button {
          margin-top: auto;
          width: 100%;
          height: 42px;
          border: none;
          border-radius: 10px;
          background: #16a34a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
        }

        .request-food-button:hover {
          background: #15803d;
        }

        .no-food-card {
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

        .no-food-card h2 {
          margin: 14px 0 6px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 700;
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
          color: #64748b;
          font-size: 15px;
        }

        @media (max-width: 950px) {
          .available-food-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 650px) {
          .available-food-page {
            padding: 20px 16px 40px;
          }

          .available-food-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .available-food-header h1 {
            font-size: 24px;
          }

          .available-food-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

      `}</style>

    </div>
  );
}