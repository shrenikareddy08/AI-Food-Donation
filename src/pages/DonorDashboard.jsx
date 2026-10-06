import { useEffect, useMemo, useState } from 'react';

import {
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { donationService } from '../services/donationService';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';

import { useNow } from '../hooks/useNow';
import {
  formatDay,
  formatDate,
  formatTime,
} from '../utils/formatDate';

import '../styles/donor-dashboard.css';


/* =========================================================
   HELPERS
========================================================= */

function normalizeDonation(item) {
  if (!item) {
    return null;
  }

  return {
    id:
      item.donation_id ??
      item.id ??
      item.donationId,

    foodName:
      item.food_name ??
      item.foodName ??
      item.name ??
      item.title ??
      'Food Donation',

    foodType:
      item.food_type ??
      item.foodType ??
      item.type ??
      'Food',

    quantity:
      item.quantity_kg ??
      item.quantityKg ??
      item.quantity ??
      0,

    unit:
      item.unit ??
      'kg',

    status:
      String(
        item.status ??
        'POSTED'
      ).toUpperCase(),

    matchedNgoName:
      item.matched_ngo_name ??
      item.matchedNgoName ??
      null,

    assignedVolunteerName:
      item.assigned_volunteer_name ??
      item.assignedVolunteerName ??
      null,

    assignedVolunteerPhone:
      item.assigned_volunteer_phone ??
      item.assignedVolunteerPhone ??
      null,

    createdAt:
      item.created_at ??
      item.createdAt ??
      item.posted_at ??
      null,

    expiry:
      item.expiry_time ??
      item.expiryTime ??
      item.expiry ??
      null,

    pickupAddress:
      item.pickup_address ??
      item.pickupAddress ??
      item.address ??
      item.location ??
      'Pickup location',

    pickupTime:
      item.pickup_time ??
      item.pickupTime ??
      null,
  };
}


function getStatusLabel(status, item) {
  if (status === 'POSTED') return 'Looking for NGO';
  if (status === 'MATCHED') {
    return item?.matchedNgoName ? `Accepted by ${item.matchedNgoName}` : 'Accepted by NGO';
  }
  if (['ASSIGNED', 'PICKUP_IN_PROGRESS', 'ACCEPTED'].includes(status)) {
    return item?.assignedVolunteerName ? `Volunteer Assigned: ${item.assignedVolunteerName}` : 'Volunteer Assigned';
  }
  if (status === 'PICKED_UP') return 'Picked Up by Volunteer';
  if (status === 'IN_TRANSIT') {
    return item?.matchedNgoName ? `On the way to ${item.matchedNgoName}` : 'In Transit';
  }
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 'Delivered Successfully';
  if (status === 'CANCELLED') return 'Cancelled';

  return status.replaceAll('_', ' ');
}


/* =========================================================
   COMPONENT
========================================================= */

export default function DonorDashboard() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const {
    location,
  } = useLocationContext();

  const now = useNow();


  const [
    donations,
    setDonations,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState('');


  /* =======================================================
     LOAD DONATIONS
  ======================================================= */

  async function loadDonations(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');


      const response =
        await donationService.getAll();


      /*
        IMPORTANT:

        apiClient now returns JSON directly.

        So the backend can return:

        [
          {...},
          {...}
        ]

        or, for compatibility:

        {
          data: [...]
        }
      */

      const rawList =
        Array.isArray(response)
          ? response
          : Array.isArray(
              response?.data
            )
            ? response.data
            : [];


      const normalized =
        rawList
          .map(
            normalizeDonation
          )
          .filter(
            (item) =>
              item !== null
          );


      setDonations(
        normalized
      );


    } catch (err) {
      console.error(
        'Failed to load donations:',
        err
      );

      setDonations([]);

      setError(
        err?.message ||
        'Unable to load your donations.'
      );


    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDonations();
  }, []);


  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    const timer =
      setInterval(() => {
        loadDonations(true);
      }, 15000);

    return () =>
      clearInterval(timer);
  }, []);


  /* =======================================================
     STATS
  ======================================================= */

  const stats =
    useMemo(() => {

      let active = 0;
      let posted = 0;
      let matched = 0;
      let transit = 0;
      let delivered = 0;

      donations.forEach(
        (donation) => {

          const status =
            donation.status;


          if (
            status === 'POSTED'
          ) {
            posted += 1;
          }


          if (
            status === 'MATCHED' ||
            status === 'ACCEPTED'
          ) {
            matched += 1;
            active += 1;
          }


          if (
            status === 'PICKED_UP' ||
            status === 'IN_TRANSIT'
          ) {
            transit += 1;
            active += 1;
          }


          if (
            status === 'DELIVERED'
          ) {
            delivered += 1;
          }

        }
      );


      /*
        POSTED donations are also active.
      */

      active += posted;


      return {
        total:
          donations.length,

        active,

        posted,

        matched,

        transit,

        delivered,
      };

    }, [donations]);


  /* =======================================================
     RECENT DONATIONS
  ======================================================= */

  const recentDonations =
    useMemo(() => {

      return [...donations]
        .sort(
          (a, b) => {

            const first =
              a.createdAt
                ? new Date(
                    a.createdAt
                  ).getTime()
                : 0;

            const second =
              b.createdAt
                ? new Date(
                    b.createdAt
                  ).getTime()
                : 0;

            return second - first;
          }
        )
        .slice(0, 3);

    }, [donations]);


  /* =======================================================
     USER NAME
  ======================================================= */

  const userName =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    'Donor';


  /* =======================================================
     LOCATION
  ======================================================= */

  const currentLocation =
    location?.label ||
    user?.location ||
    'Location not available';


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="donor-dashboard-page">

      <div className="container">


        {/* =================================================
            HEADER
        ================================================= */}

        <section className="donor-dashboard-hero">

          <div>

            <h1>
              Good {getGreeting()},
              {' '}
              {userName}!
            </h1>


            <div className="donor-dashboard-meta">

              <span>
                <Clock3 size={15} />

                {formatDay(now)}
              </span>


              <span>
                {formatDate(now)}
                {' · '}
                {formatTime(now)}
              </span>

            </div>


            <div className="donor-dashboard-location">

              <span>
                📍
              </span>

              {currentLocation}

            </div>

          </div>


          <button
            type="button"
            className="donor-dashboard-donate-button"
            onClick={() =>
              navigate('/donate')
            }
          >
            <Plus size={19} />
            Donate Food
          </button>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="donor-dashboard-error">

            <AlertCircle size={18} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                loadDonations()
              }
            >
              Retry
            </button>

          </div>

        )}


        {/* =================================================
            STATS
        ================================================= */}

        <section className="donor-dashboard-stats">


          <StatCard
            icon={Package}
            value={loading
              ? '—'
              : stats.total}
            label="Total Donations"
          />


          <StatCard
            icon={Truck}
            value={loading
              ? '—'
              : stats.active}
            label="Active Donations"
          />


          <StatCard
            icon={Clock3}
            value={loading
              ? '—'
              : stats.posted}
            label="Posted"
          />


          <StatCard
            icon={CheckCircle2}
            value={loading
              ? '—'
              : stats.delivered}
            label="Delivered"
          />

        </section>


        {/* =================================================
            RECENT DONATIONS
        ================================================= */}

        <section className="donor-dashboard-section">

          <div className="donor-dashboard-section-header">

            <div>

              <span>
                DONATION ACTIVITY
              </span>

              <h2>
                Recent donations
              </h2>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  '/donor/donations'
                )
              }
            >
              View all
              <ArrowRight size={16} />
            </button>

          </div>


          {loading && (

            <div className="donor-dashboard-loading">

              <RefreshCw
                size={25}
                className="donor-dashboard-spin"
              />

              <span>
                Loading your donations...
              </span>

            </div>

          )}


          {!loading &&
            !error &&
            recentDonations.length === 0 && (

              <div className="donor-dashboard-empty">

                <div className="donor-dashboard-empty-icon">
                  <Package size={30} />
                </div>

                <h3>
                  No donations yet
                </h3>

                <p>
                  Your food donations will appear
                  here after you post them.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/donate')
                  }
                >
                  <Plus size={17} />
                  Donate Food
                </button>

              </div>

            )}


          {!loading &&
            recentDonations.length > 0 && (

              <div className="donor-dashboard-donations">

                {recentDonations.map(
                  (donation) => (

                    <article
                      key={donation.id}
                      className="donor-dashboard-donation-card"
                    >

                      <div className="donor-dashboard-donation-icon">
                        <Package size={21} />
                      </div>


                      <div className="donor-dashboard-donation-content">

                        <div>

                          <h3>
                            {donation.foodName}
                          </h3>

                          <span>
                            {donation.foodType}
                          </span>

                        </div>


                        <div className="donor-dashboard-donation-info">

                          <strong>
                            {donation.quantity}{' '}
                            {donation.unit}
                          </strong>

                          <span>
                            {donation.pickupAddress}
                          </span>

                        </div>

                      </div>


                      <div className="donor-dashboard-donation-right">

                        <span
                          className={
                            `donor-dashboard-status donor-dashboard-status--${donation.status.toLowerCase().replaceAll('_', '-')}`
                          }
                        >
                          {getStatusLabel(
                            donation.status,
                            donation
                          )}
                        </span>


                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/donor/tracking/${donation.id}`,
                              {
                                state: {
                                  donation,
                                },
                              }
                            )
                          }
                        >
                          Track
                          <ArrowRight size={15} />
                        </button>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="donor-dashboard-quick-actions">

          <button
            type="button"
            onClick={() =>
              navigate(
                '/nearby-ngos'
              )
            }
          >

            <div className="donor-dashboard-quick-icon">
              <Package size={21} />
            </div>

            <div>

              <strong>
                Find Nearby NGOs
              </strong>

              <span>
                See verified organizations
                near your location.
              </span>

            </div>

            <ArrowRight size={18} />

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                '/donate'
              )
            }
          >

            <div className="donor-dashboard-quick-icon">
              <Plus size={21} />
            </div>

            <div>

              <strong>
                Share Food
              </strong>

              <span>
                Post your surplus food
                for redistribution.
              </span>

            </div>

            <ArrowRight size={18} />

          </button>

        </section>


        {/* =================================================
            REFRESH
        ================================================= */}

        <div className="donor-dashboard-refresh">

          <button
            type="button"
            onClick={() =>
              loadDonations(true)
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={15}
              className={
                refreshing
                  ? 'donor-dashboard-spin'
                  : ''
              }
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh dashboard'}

          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  value,
  label,
}) {
  return (
    <div className="donor-dashboard-stat-card">

      <div className="donor-dashboard-stat-icon">

        <Icon size={23} />

      </div>


      <div>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>
  );
}


/* =========================================================
   GREETING
========================================================= */

function getGreeting() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return 'morning';
  }

  if (hour < 17) {
    return 'afternoon';
  }

  return 'evening';
}