import { useEffect, useState } from 'react';
import {
  Package,
  Clock,
  User,
  Navigation,
} from 'lucide-react';

import StatusBadge from './StatusBadge';
import Button from './Button';

import { formatDistance } from '../utils/distance';
import { cn } from '../utils/cn';
import { apiClient } from '../services/apiClient';


// ============================================================
// FOOD IMAGE MAPPING
// ============================================================

function getFoodImage(foodName) {
  const name = String(foodName || '')
    .toLowerCase()
    .trim();

  // Fresh Meals
  if (
    name === 'fresh meals' ||
    name.includes('fresh meal')
  ) {
    return '/images/cooked-food.png';
  }

  // Cooked Rice
  if (
    name === 'cooked rice' ||
    name.includes('cooked rice')
  ) {
    return '/images/cooked-food.png';
  }

  // Fresh Idli
  if (
    name === 'fresh idli' ||
    name.includes('idli')
  ) {
    return '/images/rice.png';
  }

  // Vegetable Biryani
  if (
    name === 'vegetable biryani' ||
    name.includes('biryani') ||
    name.includes('biriyani')
  ) {
    return '/images/rice.png';
  }

  // General rice
  if (name.includes('rice')) {
    return '/images/rice.png';
  }

  // Vegetables
  if (
    name.includes('vegetable') ||
    name.includes('veggie')
  ) {
    return '/images/vegetables.png';
  }

  // Fruits
  if (
    name.includes('fruit') ||
    name.includes('fruits')
  ) {
    return '/images/fruits.png';
  }

  // Default
  return '/images/food-default.png';
}


// ============================================================
// DONATION HELPERS
// ============================================================

function getDonationName(donation) {
  return (
    donation?.food_name ||
    donation?.foodName ||
    donation?.name ||
    donation?.food ||
    donation?.title ||
    'Food Donation'
  );
}

function getDonationType(donation) {
  return (
    donation?.food_type ||
    donation?.foodType ||
    donation?.category ||
    donation?.type ||
    ''
  );
}

function getDonationQuantity(donation) {
  return (
    donation?.quantity ??
    donation?.food_quantity ??
    donation?.amount ??
    donation?.qty ??
    null
  );
}

function getDonationUnit(donation) {
  return (
    donation?.unit ||
    donation?.quantity_unit ||
    donation?.food_unit ||
    ''
  );
}

function getDonorName(donation) {
  return (
    donation?.donor_name ||
    donation?.donorName ||
    donation?.donor ||
    donation?.user_name ||
    donation?.userName ||
    'Donor'
  );
}


// ============================================================
// ASSIGNMENT CARD
// ============================================================

export default function AssignmentCard({
  assignment,
  onAccept,
  onViewRoute,
  onViewDetails,
  className,
}) {
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDonation() {
      if (!assignment?.donation_id) {
        setDonation(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await apiClient.get(
          `/api/donations/${assignment.donation_id}`
        );

        const actualDonation =
          response?.donation ||
          response?.data ||
          response;

        if (!cancelled) {
          setDonation(actualDonation);
        }
      } catch (error) {
        console.error(
          'Failed to load donation:',
          error
        );

        if (!cancelled) {
          setDonation(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDonation();

    return () => {
      cancelled = true;
    };
  }, [assignment?.donation_id]);


  if (!assignment) {
    return null;
  }


  // ==========================================================
  // ASSIGNMENT DATA
  // ==========================================================

  const status = String(
    assignment.status || ''
  ).toUpperCase();

  const pickupLocation =
    assignment.pickup_location ||
    'Pickup location not available';

  const deliveryLocation =
    assignment.delivery_location ||
    'Destination not available';


  // ==========================================================
  // DONATION DATA
  // ==========================================================

  const foodName =
    assignment.food_name ||
    assignment.foodName ||
    (donation ? getDonationName(donation) : (loading ? 'Loading food...' : 'Food Donation'));

  const foodType =
    assignment.food_type ||
    assignment.foodType ||
    (donation ? getDonationType(donation) : '');

  const quantity =
    assignment.quantity ??
    (donation ? getDonationQuantity(donation) : null);

  const unit =
    assignment.unit ||
    (donation ? getDonationUnit(donation) : '');

  const donor =
    assignment.donor_name ||
    assignment.donorName ||
    (donation ? getDonorName(donation) : 'Donor');


  // IMPORTANT:
  // Image is based ONLY on the actual food name.
  // Backend image_url is intentionally NOT used.

  const image = getFoodImage(foodName);


  // ==========================================================
  // DISTANCE
  // ==========================================================

  const distanceValue =
    assignment.distance_km ??
    assignment.distanceKm ??
    null;


  return (
    <div
      className={cn(
        'assignment-card',
        className
      )}
    >

      {/* ======================================================
          FOOD IMAGE
      ====================================================== */}

      <div className="assignment-card__image-wrap">

        <img
          src={image}
          alt={foodName}
          className="assignment-card__image"
          loading="lazy"

          onError={(event) => {
            console.error(
              'Food image could not be loaded:',
              event.currentTarget.src
            );

            if (
              !event.currentTarget.src.endsWith(
                'food-default.png'
              )
            ) {
              event.currentTarget.src =
                '/images/food-default.png';
            }
          }}
        />

        <div className="assignment-card__status-overlay">

          <StatusBadge
            status={status}
            size="sm"
          />

        </div>

      </div>


      {/* ======================================================
          CARD BODY
      ====================================================== */}

      <div className="assignment-card__body">

        {/* Food Name */}

        <h3 className="assignment-card__title">
          {foodName}
        </h3>


        {/* Food Type */}

        {foodType && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color:
                'var(--color-text-secondary)',
              marginBottom:
                'var(--space-2)',
            }}
          >
            {foodType}
          </div>
        )}


        {/* ====================================================
            FOOD DETAILS
        ==================================================== */}

        <div className="assignment-card__meta">

          {quantity !== null && (
            <span className="assignment-card__meta-item">

              <Package size={14} />

              {quantity}

              {unit && ` ${unit}`}

            </span>
          )}


          {distanceValue !== null && (
            <span className="assignment-card__meta-item">

              <Navigation size={14} />

              {formatDistance(
                Number(distanceValue)
              )}

            </span>
          )}


          {assignment.pickup_time && (
            <span className="assignment-card__meta-item">

              <Clock size={14} />

              {new Date(
                assignment.pickup_time
              ).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}

            </span>
          )}

        </div>


        {/* ====================================================
            ROUTE
        ==================================================== */}

        <div className="assignment-card__route">

          {/* Pickup */}

          <div className="assignment-card__route-point">

            <span
              className="
                assignment-card__route-dot
                assignment-card__route-dot--pickup
              "
            />

            <div>

              <div className="assignment-card__route-label">
                Pickup
              </div>

              <div className="assignment-card__route-text">
                {pickupLocation}
              </div>

            </div>

          </div>


          <div className="assignment-card__route-line" />


          {/* Destination */}

          <div className="assignment-card__route-point">

            <span
              className="
                assignment-card__route-dot
                assignment-card__route-dot--dest
              "
            />

            <div>

              <div className="assignment-card__route-label">
                Destination
              </div>

              <div className="assignment-card__route-text">
                {deliveryLocation}
              </div>

            </div>

          </div>

        </div>


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="assignment-card__footer">

          <div className="assignment-card__info">

            <span>
              <User size={12} />
              {donor}
            </span>


            {assignment.pickup_time && (
              <span>

                <Clock size={12} />

                {new Date(
                  assignment.pickup_time
                ).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}

              </span>
            )}

          </div>

        </div>


        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="assignment-card__actions">

          {['PENDING', 'REQUESTED'].includes(status) &&
            onAccept && (

              <Button
                size="sm"
                fullWidth
                onClick={() =>
                  onAccept(assignment)
                }
              >
                Accept Assignment
              </Button>

            )}


          {!['PENDING', 'REQUESTED'].includes(status) &&
            onViewDetails && (

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onViewDetails(assignment)
                }
              >
                View Details
              </Button>

            )}


          {onViewRoute && (

            <Button
              size="sm"
              variant="ghost"
              leftIcon={Navigation}
              onClick={() =>
                onViewRoute(assignment)
              }
            >
              Route
            </Button>

          )}

        </div>

      </div>

    </div>
  );
}