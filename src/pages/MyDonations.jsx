import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock3,
  HandHeart,
  MapPin,
  RefreshCw,
  Eye,
  Navigation,
} from 'lucide-react';

import donationService from '../services/donationService';
import LocationHeader from '../components/LocationHeader';

import '../styles/my-donations.css';

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeStatus(status) {
  return String(status || 'POSTED').toUpperCase();
}

function getStatusLabel(status, donation) {
  const value = normalizeStatus(status);

  if (value === 'POSTED') return 'Looking for NGO';
  if (value === 'MATCHED') {
    return donation?.matched_ngo_name ? `Accepted by ${donation.matched_ngo_name}` : 'Accepted by NGO';
  }
  if (['ASSIGNED', 'PICKUP_IN_PROGRESS', 'ACCEPTED'].includes(value)) {
    return donation?.assigned_volunteer_name ? `Volunteer Assigned: ${donation.assigned_volunteer_name}` : 'Volunteer Assigned';
  }
  if (value === 'PICKED_UP') return 'Picked Up by Volunteer';
  if (value === 'IN_TRANSIT') {
    return donation?.matched_ngo_name ? `On the way to ${donation.matched_ngo_name}` : 'In Transit';
  }
  if (['DELIVERED', 'COMPLETED'].includes(value)) return 'Delivered Successfully';
  if (value === 'CANCELLED') return 'Cancelled';

  return value.replaceAll('_', ' ');
}

function getStatusClass(status) {
  return normalizeStatus(status).toLowerCase().replaceAll('_', '-');
}

function getFoodName(donation) {
  return (
    donation?.food_name ||
    donation?.foodName ||
    donation?.name ||
    donation?.title ||
    'Food Donation'
  );
}

function getFoodType(donation) {
  return (
    donation?.food_type ||
    donation?.foodType ||
    donation?.type ||
    'Food'
  );
}

function getQuantity(donation) {
  const quantity =
    donation?.quantity_kg ??
    donation?.quantityKg ??
    donation?.quantity;

  if (quantity === undefined || quantity === null || quantity === '') {
    return '—';
  }

  return `${quantity} kg`;
}

function getPickupAddress(donation) {
  return (
    donation?.pickup_address ||
    donation?.pickupAddress ||
    donation?.address ||
    'Pickup location not available'
  );
}

function getCreatedDate(donation) {
  return donation?.created_at || donation?.createdAt || donation?.posted_at;
}

function getExpiryDate(donation) {
  return donation?.expiry_time || donation?.expiryTime || donation?.expiry;
}

export default function MyDonations() {
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadDonations(showRefresh = false) {
    try {
      setError('');

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await donationService.getAll();

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setDonations(data);
    } catch (err) {
      console.error('Failed to load donations:', err);

      setDonations([]);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to load your donations.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  const stats = useMemo(() => {
    const result = {
      total: donations.length,
      posted: 0,
      matched: 0,
      transit: 0,
      delivered: 0,
    };

    donations.forEach((donation) => {
      const status = normalizeStatus(donation?.status);

      if (status === 'POSTED') {
        result.posted += 1;
      }

      if (
        status === 'MATCHED' ||
        status === 'ACCEPTED'
      ) {
        result.matched += 1;
      }

      if (
        status === 'PICKED_UP' ||
        status === 'IN_TRANSIT'
      ) {
        result.transit += 1;
      }

      if (status === 'DELIVERED') {
        result.delivered += 1;
      }
    });

    return result;
  }, [donations]);

  const filteredDonations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return donations.filter((donation) => {
      const status = normalizeStatus(donation?.status);

      const matchesStatus =
        statusFilter === 'ALL' ||
        status === statusFilter;

      const searchableText = [
        getFoodName(donation),
        getFoodType(donation),
        getPickupAddress(donation),
        status,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchableText.includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [donations, search, statusFilter]);

  function handleTrack(donation) {
    if (!donation?.id) {
      return;
    }

    navigate(`/donor/tracking/${donation.id}`);
  }

  function handleView(donation) {
    if (!donation?.id) {
      return;
    }

    navigate(`/donor/tracking/${donation.id}`);
  }

  return (
    <div className="my-donations-page">
      <div className="my-donations-container">

        {/* Header */}
        <section className="donations-hero">
          <div className="donations-hero-top">
            <div>
              <div className="page-eyebrow">
                <Package size={18} />
                Donation Activity
              </div>

              <h1>My Donations</h1>

              <p>
                Keep track of every food donation from posting
                to delivery.
              </p>
            </div>

            <button
              className="primary-donate-button"
              onClick={() => navigate('/donate')}
            >
              <Plus size={20} />
              Donate Food
            </button>
          </div>

          <LocationHeader />
        </section>

        {/* Statistics */}
        <section className="donation-stats-grid">

          <div className="donation-stat-card">
            <div className="stat-icon">
              <Package size={22} />
            </div>

            <div>
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="donation-stat-card">
            <div className="stat-icon posted-icon">
              <Package size={22} />
            </div>

            <div>
              <span>Posted</span>
              <strong>{stats.posted}</strong>
            </div>
          </div>

          <div className="donation-stat-card">
            <div className="stat-icon matched-icon">
              <HandHeart size={22} />
            </div>

            <div>
              <span>Matched</span>
              <strong>{stats.matched}</strong>
            </div>
          </div>

          <div className="donation-stat-card">
            <div className="stat-icon transit-icon">
              <Truck size={22} />
            </div>

            <div>
              <span>In Transit</span>
              <strong>{stats.transit}</strong>
            </div>
          </div>

          <div className="donation-stat-card">
            <div className="stat-icon delivered-icon">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Delivered</span>
              <strong>{stats.delivered}</strong>
            </div>
          </div>

        </section>

        {/* Controls */}
        <section className="donations-controls">

          <div className="donations-search">
            <Search size={20} />

            <input
              type="text"
              placeholder="Search your donations..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="donations-filter">
            <Filter size={18} />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">All Status</option>
              <option value="POSTED">Posted</option>
              <option value="MATCHED">Matched</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            className="refresh-button"
            onClick={() => loadDonations(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? 'spin' : ''}
            />
            Refresh
          </button>

        </section>

        {/* Donations */}
        <section className="donations-list-section">

          <div className="section-heading-row">
            <div>
              <h2>Your food donations</h2>

              <p>
                {filteredDonations.length}{' '}
                {filteredDonations.length === 1
                  ? 'donation'
                  : 'donations'}{' '}
                shown
              </p>
            </div>
          </div>

          {loading && (
            <div className="donations-state-card">
              <div className="loading-spinner" />
              <h3>Loading your donations...</h3>
              <p>Please wait a moment.</p>
            </div>
          )}

          {!loading && error && (
            <div className="donations-state-card error-state">
              <h3>Unable to load donations</h3>
              <p>{error}</p>

              <button
                className="secondary-button"
                onClick={() => loadDonations()}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredDonations.length === 0 && (
              <div className="donations-state-card">
                <div className="empty-icon">
                  <Package size={34} />
                </div>

                <h3>
                  {donations.length === 0
                    ? 'No donations yet'
                    : 'No donations found'}
                </h3>

                <p>
                  {donations.length === 0
                    ? 'Start by sharing your surplus food with someone who needs it.'
                    : 'Try changing your search or status filter.'}
                </p>

                {donations.length === 0 && (
                  <button
                    className="primary-donate-button"
                    onClick={() => navigate('/donate')}
                  >
                    <Plus size={18} />
                    Donate Food
                  </button>
                )}
              </div>
            )}

          {!loading &&
            !error &&
            filteredDonations.length > 0 && (
              <div className="donations-card-grid">

                {filteredDonations.map((donation) => {
                  const status = normalizeStatus(
                    donation?.status
                  );

                  const createdDate =
                    getCreatedDate(donation);

                  const expiryDate =
                    getExpiryDate(donation);

                  return (
                    <article
                      className="donation-card"
                      key={donation.id}
                    >

                      <div className="donation-card-header">

                        <div className="food-icon-box">
                          <Package size={24} />
                        </div>

                        <div className="donation-title-area">
                          <h3>
                            {getFoodName(donation)}
                          </h3>

                          <span>
                            {getFoodType(donation)}
                          </span>
                        </div>

                        <span
                          className={`donation-status status-${getStatusClass(
                            status
                          )}`}
                        >
                          {getStatusLabel(status, donation)}
                        </span>

                      </div>

                      <div className="donation-card-details">

                        <div className="donation-detail">
                          <span>Quantity</span>
                          <strong>
                            {getQuantity(donation)}
                          </strong>
                        </div>

                        <div className="donation-detail">
                          <span>Posted</span>
                          <strong>
                            {formatDate(createdDate)}
                          </strong>
                        </div>

                        <div className="donation-detail">
                          <span>Pickup</span>
                          <strong>
                            {formatTime(
                              donation?.pickup_time ||
                              donation?.pickupTime
                            )}
                          </strong>
                        </div>

                      </div>

                      <div className="donation-location">
                        <MapPin size={18} />

                        <span>
                          {getPickupAddress(donation)}
                        </span>
                      </div>

                      {expiryDate && (
                        <div className="donation-expiry">
                          <Clock3 size={17} />

                          <span>
                            Expires on{' '}
                            <strong>
                              {formatDate(expiryDate)}
                            </strong>
                          </span>
                        </div>
                      )}

                      <div className="donation-card-footer">

                        <button
                          className="secondary-button"
                          onClick={() =>
                            handleView(donation)
                          }
                        >
                          <Eye size={17} />
                          View
                        </button>

                        <button
                          className="track-button"
                          onClick={() =>
                            handleTrack(donation)
                          }
                        >
                          <Navigation size={17} />
                          Track Donation
                        </button>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

        </section>

      </div>
    </div>
  );
}