import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Search,
  Bike,
  Loader2,
} from 'lucide-react';

import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { apiClient } from '../../services/apiClient';
import { formatDate } from '../../utils/formatDate';

function getArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function normalizeVolunteer(volunteer) {
  return {
    id:
      volunteer.volunteer_id ??
      volunteer.id,

    userId:
      volunteer.user_id ??
      volunteer.userId,

    name:
      volunteer.name ??
      volunteer.full_name ??
      volunteer.fullName ??
      volunteer.username ??
      volunteer.user_name ??
      volunteer.user?.name ??
      volunteer.user?.full_name ??
      volunteer.user?.username ??
      'Volunteer',

    email:
      volunteer.email ??
      volunteer.user?.email ??
      '—',

    phone:
      volunteer.phone ??
      volunteer.phone_number ??
      volunteer.user?.phone ??
      volunteer.user?.phone_number ??
      '—',

    availability:
      String(
        volunteer.availability ??
          'UNAVAILABLE'
      ).toUpperCase(),

    vehicleType:
      volunteer.vehicle_type ??
      volunteer.vehicleType ??
      '—',

    vehicleNumber:
      volunteer.vehicle_number ??
      volunteer.vehicleNumber ??
      '—',

    location:
      volunteer.current_location ??
      volunteer.currentLocation ??
      volunteer.location ??
      '—',

    latitude:
      volunteer.latitude ?? null,

    longitude:
      volunteer.longitude ?? null,

    createdAt:
      volunteer.created_at ??
      volunteer.createdAt ??
      null,
  };
}

function getAvailabilityLabel(status) {
  switch (status) {
    case 'AVAILABLE':
      return 'Available';

    case 'UNAVAILABLE':
      return 'Unavailable';

    case 'BUSY':
      return 'Busy';

    default:
      return status || 'Unknown';
  }
}

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] =
    useState('all');
  const [vehicleFilter, setVehicleFilter] =
    useState('all');
  const [sortBy, setSortBy] =
    useState('newest');

  const [selected, setSelected] =
    useState(null);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      setError('');

      /*
       * Admin volunteer list.
       * Data comes directly from the backend/database.
       */
      const response = await apiClient.get(
        '/api/volunteers/'
      );

      const data = getArray(response);

      setVolunteers(
        data.map(normalizeVolunteer)
      );
    } catch (err) {
      console.error(
        'Failed to load volunteers:',
        err
      );

      setVolunteers([]);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Failed to load volunteers.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const filtered = useMemo(() => {
    let result = [...volunteers];

    // Search
    if (search.trim()) {
      const q = search
        .toLowerCase()
        .trim();

      result = result.filter((volunteer) => {
        return (
          String(
            volunteer.name
          )
            .toLowerCase()
            .includes(q) ||

          String(
            volunteer.email
          )
            .toLowerCase()
            .includes(q) ||

          String(
            volunteer.vehicleType
          )
            .toLowerCase()
            .includes(q) ||

          String(
            volunteer.vehicleNumber
          )
            .toLowerCase()
            .includes(q) ||

          String(
            volunteer.location
          )
            .toLowerCase()
            .includes(q)
        );
      });
    }

    // Availability filter
    if (
      availabilityFilter !== 'all'
    ) {
      result = result.filter(
        (volunteer) =>
          volunteer.availability ===
          availabilityFilter
      );
    }

    // Vehicle filter
    if (
      vehicleFilter !== 'all'
    ) {
      result = result.filter(
        (volunteer) =>
          volunteer.vehicleType ===
          vehicleFilter
      );
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort(
        (a, b) =>
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
      );
    }

    if (sortBy === 'oldest') {
      result.sort(
        (a, b) =>
          new Date(
            a.createdAt || 0
          ) -
          new Date(
            b.createdAt || 0
          )
      );
    }

    if (sortBy === 'name') {
      result.sort((a, b) =>
        String(
          a.name
        ).localeCompare(
          String(b.name)
        )
      );
    }

    return result;
  }, [
    volunteers,
    search,
    availabilityFilter,
    vehicleFilter,
    sortBy,
  ]);

  const vehicleTypes = useMemo(() => {
    return [
      ...new Set(
        volunteers
          .map(
            (volunteer) =>
              volunteer.vehicleType
          )
          .filter(
            (type) =>
              type &&
              type !== '—'
          )
      ),
    ];
  }, [volunteers]);

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Volunteers
          </h1>

          <p className="admin-page-header__subtitle">
            Manage registered volunteers
          </p>
        </div>

        <div
          style={{
            minHeight: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Loader2 size={22} />
          Loading volunteers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Volunteers
          </h1>

          <p className="admin-page-header__subtitle">
            Manage registered volunteers
          </p>
        </div>

        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color:
                'var(--color-text-secondary)',
            }}
          >
            {error}
          </p>

          <Button
            size="sm"
            variant="outline"
            onClick={loadVolunteers}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">
          Volunteers
        </h1>

        <p className="admin-page-header__subtitle">
          Manage registered volunteers
        </p>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <div className="search-bar">
            <div className="search-bar__input-wrap">
              <Search
                size={18}
                className="search-bar__icon"
              />

              <input
                className="search-bar__input"
                placeholder="Search volunteers..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="admin-toolbar__filters">

          {/* Availability */}
          <select
            className="admin-filter-select"
            value={
              availabilityFilter
            }
            onChange={(e) =>
              setAvailabilityFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Availability
            </option>

            <option value="AVAILABLE">
              Available
            </option>

            <option value="BUSY">
              Busy
            </option>

            <option value="UNAVAILABLE">
              Unavailable
            </option>
          </select>

          {/* Vehicle */}
          <select
            className="admin-filter-select"
            value={vehicleFilter}
            onChange={(e) =>
              setVehicleFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Vehicles
            </option>

            {vehicleTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>

          {/* Sort */}
          <select
            className="admin-filter-select"
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
          >
            <option value="newest">
              Newest First
            </option>

            <option value="oldest">
              Oldest First
            </option>

            <option value="name">
              Name A-Z
            </option>
          </select>
        </div>

        <span className="admin-toolbar__count">
          {filtered.length} volunteers
        </span>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="No volunteers found"
          message="Try adjusting your search or filters."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Volunteer</th>
                  <th>Email</th>
                  <th>Availability</th>
                  <th>Vehicle</th>
                  <th>Vehicle Number</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (volunteer) => (
                    <tr
                      key={
                        volunteer.id
                      }
                    >
                      <td className="data-table__id">
                        #
                        {
                          volunteer.id
                        }
                      </td>

                      <td className="data-table__name">
                        {
                          volunteer.name
                        }
                      </td>

                      <td>
                        {
                          volunteer.email
                        }
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            volunteer.availability
                          }
                          size="sm"
                        />
                      </td>

                      <td>
                        {
                          volunteer.vehicleType
                        }
                      </td>

                      <td>
                        {
                          volunteer.vehicleNumber
                        }
                      </td>

                      <td>
                        {
                          volunteer.location
                        }
                      </td>

                      <td>
                        {volunteer.createdAt
                          ? formatDate(
                              volunteer.createdAt
                            )
                          : '—'}
                      </td>

                      <td>
                        <div className="data-table__actions">
                          <button
                            className="data-table__action"
                            onClick={() =>
                              setSelected(
                                volunteer
                              )
                            }
                            aria-label="View volunteer"
                          >
                            <Eye
                              size={16}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="data-cards">
            {filtered.map(
              (volunteer) => (
                <div
                  key={
                    volunteer.id
                  }
                  className="data-card"
                >
                  <div className="data-card__header">
                    <div>
                      <div className="data-card__title">
                        {
                          volunteer.name
                        }
                      </div>

                      <div className="data-card__id">
                        #
                        {
                          volunteer.id
                        }
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        volunteer.availability
                      }
                      size="sm"
                    />
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Email
                    </span>

                    <span className="data-card__value">
                      {
                        volunteer.email
                      }
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Vehicle
                    </span>

                    <span className="data-card__value">
                      {
                        volunteer.vehicleType
                      }
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Vehicle Number
                    </span>

                    <span className="data-card__value">
                      {
                        volunteer.vehicleNumber
                      }
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Location
                    </span>

                    <span className="data-card__value">
                      {
                        volunteer.location
                      }
                    </span>
                  </div>

                  <div className="data-card__actions">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={Eye}
                      onClick={() =>
                        setSelected(
                          volunteer
                        )
                      }
                    >
                      View
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* View Volunteer Modal */}
      <Modal
        open={!!selected}
        onClose={() =>
          setSelected(null)
        }
        title="Volunteer Details"
        size="md"
      >
        {selected && (
          <div className="detail-rows">

            <div className="detail-row">
              <span className="detail-row__label">
                Volunteer ID
              </span>

              <span className="detail-row__value">
                #{selected.id}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                User ID
              </span>

              <span className="detail-row__value">
                {selected.userId ||
                  '—'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Name
              </span>

              <span className="detail-row__value">
                {selected.name}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Email
              </span>

              <span className="detail-row__value">
                {selected.email}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Phone
              </span>

              <span className="detail-row__value">
                {selected.phone}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Availability
              </span>

              <span className="detail-row__value">
                <StatusBadge
                  status={
                    selected.availability
                  }
                  size="sm"
                />
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Vehicle Type
              </span>

              <span className="detail-row__value">
                {
                  selected.vehicleType
                }
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Vehicle Number
              </span>

              <span className="detail-row__value">
                {
                  selected.vehicleNumber
                }
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Current Location
              </span>

              <span className="detail-row__value">
                {
                  selected.location
                }
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Latitude
              </span>

              <span className="detail-row__value">
                {selected.latitude ??
                  '—'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Longitude
              </span>

              <span className="detail-row__value">
                {selected.longitude ??
                  '—'}
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Joined At
              </span>

              <span className="detail-row__value">
                {selected.createdAt
                  ? formatDate(
                      selected.createdAt
                    )
                  : '—'}
              </span>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}