import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  Truck,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { apiClient } from '../../services/apiClient';

function getId(value) {
  return (
    value?.assignment_id ??
    value?.assignmentId ??
    value?.id
  );
}

function getDonationId(value) {
  return (
    value?.donation_id ??
    value?.donationId ??
    value?.donation?.donation_id ??
    value?.donation?.donationId ??
    value?.donation?.id
  );
}

function normalizeDonation(donation) {
  if (!donation) {
    return null;
  }

  return {
    donationId:
      donation.donation_id ??
      donation.donationId ??
      donation.id,

    foodName:
      donation.food_name ??
      donation.foodName ??
      donation.name ??
      'Food Donation',

    quantity:
      donation.quantity ??
      null,

    unit:
      donation.unit ??
      'kg',

    location:
      donation.location ??
      donation.pickup_address ??
      donation.pickupAddress ??
      'Pickup location',

    expiryTime:
      donation.expiry_time ??
      donation.expiryTime ??
      null,

    image:
      donation.image_url ??
      donation.imageUrl ??
      donation.image ??
      null,

    status:
      donation.status ??
      'POSTED',
  };
}

function normalizeAssignment(assignment) {
  return {
    assignmentId: getId(assignment),

    donationId: getDonationId(assignment),

    status:
      assignment?.status ??
      assignment?.assignment_status ??
      assignment?.assignmentStatus ??
      'ASSIGNED',

    donation: normalizeDonation(
      assignment?.donation
    ),

    volunteer:
      assignment?.volunteer ?? null,
  };
}

function formatQuantity(donation) {
  if (
    !donation ||
    donation.quantity === null ||
    donation.quantity === undefined
  ) {
    return 'Quantity not available';
  }

  return `${Number(donation.quantity).toFixed(2)} ${
    donation.unit || 'kg'
  }`;
}

function getStatus(status) {
  const value = String(
    status || ''
  ).toUpperCase();

  if (value === 'DELIVERED') {
    return 'DELIVERED';
  }

  if (value === 'PICKED_UP') {
    return 'PICKED UP';
  }

  if (value === 'IN_TRANSIT') {
    return 'IN TRANSIT';
  }

  if (value === 'ASSIGNED') {
    return 'ASSIGNED';
  }

  return value || 'ASSIGNED';
}

export default function IncomingDonations() {
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      setLoading(true);
      setError('');

      /*
       * Get assignments belonging to the logged-in NGO.
       */
      const assignmentResponse =
        await apiClient.get(
          '/api/assignments'
        );

      const assignmentList =
        Array.isArray(assignmentResponse)
          ? assignmentResponse
          : assignmentResponse?.items ??
            assignmentResponse?.data ??
            [];

      /*
       * Convert assignments into a clean format.
       */
      const assignments =
        assignmentList
          .map(normalizeAssignment)
          .filter(
            (item) =>
              item.assignmentId !== null &&
              item.assignmentId !== undefined
          );

      /*
       * Get the donation information.
       *
       * Some backend responses include the donation
       * inside the assignment.
       *
       * If they don't, fetch it using donation_id.
       */
      const completed = await Promise.all(
        assignments.map(
          async (assignment) => {
            if (assignment.donation) {
              return assignment;
            }

            if (
              assignment.donationId === null ||
              assignment.donationId === undefined
            ) {
              return assignment;
            }

            try {
              const donation =
                await apiClient.get(
                  `/api/donations/${assignment.donationId}`
                );

              return {
                ...assignment,
                donation:
                  normalizeDonation(
                    donation
                  ),
              };
            } catch (err) {
              console.error(
                `Unable to load donation ${assignment.donationId}`,
                err
              );

              return assignment;
            }
          }
        )
      );

      /*
       * REMOVE DUPLICATES
       *
       * One donation should appear only once.
       *
       * If the same donation has multiple assignment
       * records, keep the latest assignment.
       */
      const uniqueByDonation =
        new Map();

      completed.forEach(
        (assignment) => {
          const donationId =
            assignment.donationId ??
            assignment.donation?.donationId;

          if (
            donationId !== null &&
            donationId !== undefined
          ) {
            uniqueByDonation.set(
              String(donationId),
              assignment
            );
          } else {
            uniqueByDonation.set(
              `assignment-${assignment.assignmentId}`,
              assignment
            );
          }
        }
      );

      setDeliveries(
        Array.from(
          uniqueByDonation.values()
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to load deliveries.'
      );
    } finally {
      setLoading(false);
    }
  }

  function openDelivery(assignmentId) {
  if (!assignmentId) {
    return;
  }

  navigate(
    `/ngo/delivery/${assignmentId}`
  );
}

function openTracking(assignmentId) {
  if (!assignmentId) {
    return;
  }

  navigate(
    `/ngo/tracking/${assignmentId}`
  );
}
  if (loading) {
    return (
      <div className="incoming-page">
        <div className="incoming-loading">
          <Loader2
            size={22}
            className="loading-spinner"
          />
          Loading deliveries...
        </div>
      </div>
    );
  }

  return (
    <div className="incoming-page">

      <div className="incoming-container">

        {/* HEADER */}

        <div className="incoming-header">

          <div>
            <div className="incoming-label">
              NGO
            </div>

            <h1>
              Incoming Deliveries
            </h1>

            <p>
              Track food deliveries assigned
              to your NGO.
            </p>
          </div>

          <div className="delivery-count">
            {deliveries.length} Deliveries
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="incoming-error">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!error &&
          deliveries.length === 0 && (
            <div className="incoming-empty">

              <Truck size={42} />

              <h2>
                No deliveries yet
              </h2>

              <p>
                Accepted food deliveries will
                appear here.
              </p>

            </div>
          )}

        {/* DELIVERY LIST */}

        <div className="incoming-list">

          {deliveries.map(
            (delivery) => {

              const donation =
                delivery.donation;

              const foodName =
                donation?.foodName ??
                'Food Donation';

              const location =
                donation?.location ??
                'Pickup location';

              return (
                <div
                  className="delivery-card"
                  key={
                    delivery.donationId ??
                    delivery.assignmentId
                  }
                >

                  {/* ICON */}

                  <div className="delivery-icon">
                    <Package size={24} />
                  </div>

                  {/* CONTENT */}

                  <div className="delivery-main">

                    <div className="delivery-top">

                      <div>

                        <span className="delivery-label">
                          FOOD DELIVERY
                        </span>

                        <h2>
                          {foodName}
                        </h2>

                      </div>

                      <span
                        className={`delivery-status ${
                          String(
                            delivery.status
                          ).toUpperCase() ===
                          'DELIVERED'
                            ? 'delivered'
                            : ''
                        }`}
                      >
                        {getStatus(
                          delivery.status
                        )}
                      </span>

                    </div>

                    {/* DETAILS */}

                    <div className="delivery-details">

                      <div>
                        <Package size={16} />

                        <span>
                          {formatQuantity(
                            donation
                          )}
                        </span>
                      </div>

                      <div>
                        <MapPin size={16} />

                        <span>
                          {location}
                        </span>
                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="delivery-actions">

                     <button
  className="view-delivery-button"
  onClick={() =>
    openDelivery(
      delivery.assignmentId
    )
  }
>
  View Delivery

  <ArrowRight
    size={16}
  />
</button>

                      <button
                        className="track-button"
                        onClick={() =>
                          openTracking(
                            delivery.assignmentId
                          )
                        }
                      >
                        <Truck size={16} />

                        Track
                      </button>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

      <style>{`

        .incoming-page {
          min-height: 100vh;
          background: var(--color-bg, #f8fafc);
          color: var(--color-text, #0f172a);
          padding: 32px 20px 60px;
        }

        .incoming-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .incoming-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .incoming-label {
          color: var(--color-primary-600, #16a34a);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .incoming-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 850;
          color: var(--color-text, #0f172a);
        }

        .incoming-header p {
          margin: 7px 0 0;
          color: var(--color-text-secondary, #64748b);
          font-size: 14px;
        }

        .delivery-count {
          padding: 9px 14px;
          border-radius: 999px;
          background: var(--color-primary-50, #f0fdf4);
          border: 1px solid var(--color-primary-200, #bbf7d0);
          color: var(--color-primary-700, #15803d);
          font-size: 13px;
          font-weight: 750;
          white-space: nowrap;
        }

        .incoming-error {
          padding: 14px 16px;
          margin-bottom: 20px;
          border-radius: 13px;
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.18);
          color: #dc2626;
        }

        .incoming-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .delivery-card {
          display: flex;
          gap: 18px;
          padding: 20px;
          border-radius: 20px;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: var(--shadow-sm);
        }

        .delivery-icon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 15px;
          background: var(--color-primary-50, #f0fdf4);
          color: var(--color-primary-600, #16a34a);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delivery-main {
          flex: 1;
          min-width: 0;
        }

        .delivery-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .delivery-label {
          color: var(--color-text-tertiary, #94a3b8);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        .delivery-top h2 {
          margin: 4px 0 0;
          font-size: 20px;
          font-weight: 750;
          color: var(--color-text, #0f172a);
        }

        .delivery-status {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.20);
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .delivery-status.delivered {
          background: var(--color-primary-50, #f0fdf4);
          border-color: var(--color-primary-200, #bbf7d0);
          color: var(--color-primary-700, #15803d);
        }

        .delivery-details {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 14px;
        }

        .delivery-details div {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--color-text-secondary, #64748b);
          font-size: 13px;
        }

        .delivery-details svg {
          color: var(--color-text-tertiary, #94a3b8);
        }

        .delivery-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .view-delivery-button,
        .track-button {
          min-height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .view-delivery-button {
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-surface, #ffffff);
          color: var(--color-text, #0f172a);
        }

        .view-delivery-button:hover {
          background: var(--color-neutral-100, #f1f5f9);
        }

        .track-button {
          border: none;
          background: var(--color-primary-600, #16a34a);
          color: #ffffff;
        }

        .track-button:hover {
          background: var(--color-primary-700, #15803d);
        }

        .incoming-empty {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 20px;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          color: var(--color-text-secondary, #64748b);
          box-shadow: var(--shadow-sm);
        }

        .incoming-empty h2 {
          margin: 14px 0 5px;
          color: var(--color-text, #0f172a);
          font-size: 20px;
        }

        .incoming-empty p {
          margin: 0;
          color: var(--color-text-secondary, #64748b);
          font-size: 14px;
        }

        .incoming-loading {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: var(--color-text-secondary, #64748b);
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 650px) {

          .incoming-page {
            padding: 20px 12px 40px;
          }

          .incoming-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .incoming-header h1 {
            font-size: 27px;
          }

          .delivery-card {
            padding: 16px;
          }

          .delivery-top {
            flex-direction: column;
          }

          .delivery-actions {
            flex-direction: column;
          }

          .view-delivery-button,
          .track-button {
            width: 100%;
          }

        }

      `}</style>
    </div>
  );
}