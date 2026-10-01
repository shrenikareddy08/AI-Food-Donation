import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Trash2,
  Search,
  Truck,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Button from '../../components/Button';

import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import donationService from '../../services/donationService';
import { formatDate } from '../../utils/formatDate';

function getArray(data) {
  if (Array.isArray(data)) return data;

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

function getValue(item, ...keys) {
  for (const key of keys) {
    if (
      item?.[key] !== undefined &&
      item?.[key] !== null
    ) {
      return item[key];
    }
  }

  return null;
}

function normalizeId(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number)
    ? value
    : number;
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function getUserName(user) {
  if (!user) return null;

  return (
    getValue(
      user,
      'name',
      'full_name',
      'fullName',
      'username',
      'email'
    ) || null
  );
}

function getNgoName(ngo) {
  if (!ngo) return null;

  return (
    getValue(
      ngo,
      'name',
      'ngo_name',
      'ngoName',
      'organization_name',
      'organizationName'
    ) || null
  );
}

function getVolunteerName(volunteer, users) {
  if (!volunteer) return null;

  const directName = getValue(
    volunteer,
    'name',
    'full_name',
    'fullName',
    'username',
    'email'
  );

  if (directName) {
    return directName;
  }

  const userId = normalizeId(
    getValue(
      volunteer,
      'user_id',
      'userId'
    )
  );

  if (userId !== null) {
    const user = users.find(
      (item) =>
        Number(
          getValue(
            item,
            'user_id',
            'id'
          )
        ) === Number(userId)
    );

    return getUserName(user);
  }

  return null;
}

function normalizeDonation(
  donation,
  users,
  assignments,
  ngos,
  volunteers
) {
  const id = normalizeId(
    getValue(
      donation,
      'donation_id',
      'id'
    )
  );

  const donorId = normalizeId(
    getValue(
      donation,
      'donor_id',
      'donorId'
    )
  );

  const relatedAssignment =
    assignments.find(
      (assignment) =>
        Number(
          getValue(
            assignment,
            'donation_id',
            'donationId'
          )
        ) === Number(id)
    );

  const assignmentNgoId =
    relatedAssignment
      ? normalizeId(
          getValue(
            relatedAssignment,
            'ngo_id',
            'ngoId'
          )
        )
      : null;

  const assignmentVolunteerId =
    relatedAssignment
      ? normalizeId(
          getValue(
            relatedAssignment,
            'volunteer_id',
            'volunteerId'
          )
        )
      : null;

  const donorUser =
    donorId !== null
      ? users.find(
          (user) =>
            Number(
              getValue(
                user,
                'user_id',
                'id'
              )
            ) === Number(donorId)
        )
      : null;

  const ngo =
    assignmentNgoId !== null
      ? ngos.find(
          (item) =>
            Number(
              getValue(
                item,
                'ngo_id',
                'id'
              )
            ) ===
            Number(assignmentNgoId)
        )
      : null;

  const volunteer =
    assignmentVolunteerId !== null
      ? volunteers.find(
          (item) =>
            Number(
              getValue(
                item,
                'volunteer_id',
                'id'
              )
            ) ===
            Number(
              assignmentVolunteerId
            )
        )
      : null;

  const foodName =
    getValue(
      donation,
      'food_name',
      'foodName',
      'name'
    ) || 'Food Donation';

  const foodType =
    getValue(
      donation,
      'food_type',
      'foodType',
      'category',
      'type'
    ) || '—';

  const quantity = getValue(
    donation,
    'quantity'
  );

  const unit =
    getValue(
      donation,
      'unit'
    ) || '';

  const pickupLocation =
    getValue(
      donation,
      'pickup_location',
      'pickupLocation',
      'location'
    ) || '—';

  /*
   * Try to display a location such as:
   * "Hitech City, Hyderabad"
   *
   * If backend only has one location field,
   * use that directly.
   */
  const area =
    getValue(
      donation,
      'area',
      'pickup_area'
    );

  const city =
    getValue(
      donation,
      'city',
      'pickup_city'
    );

  let location = pickupLocation;

  if (area && city) {
    location = `${area}, ${city}`;
  } else if (area) {
    location = area;
  } else if (city) {
    location = city;
  }

  return {
    id,

    donationId: id,

    foodName,

    foodType,

    quantity,

    unit,

    donorId,

    donor:
      getUserName(donorUser) ||
      (donorId
        ? `User #${donorId}`
        : '—'),

    ngoId: assignmentNgoId,

    ngo:
      getNgoName(ngo) ||
      (assignmentNgoId
        ? `NGO #${assignmentNgoId}`
        : '—'),

    volunteerId:
      assignmentVolunteerId,

    volunteer:
      getVolunteerName(
        volunteer,
        users
      ) ||
      (assignmentVolunteerId
        ? `Volunteer #${assignmentVolunteerId}`
        : '—'),

    area,

    city,

    location,

    status: normalizeStatus(
      getValue(
        donation,
        'status'
      )
    ),

    postedAt:
      getValue(
        donation,
        'created_at',
        'createdAt',
        'posted_at',
        'postedAt'
      ),

    expiryTime:
      getValue(
        donation,
        'expiry_time',
        'expiryTime'
      ),

    pickupLocation,

    image:
      getValue(
        donation,
        'image_url',
        'imageUrl',
        'image'
      ),

    assignmentId:
      relatedAssignment
        ? normalizeId(
            getValue(
              relatedAssignment,
              'assignment_id',
              'id'
            )
          )
        : null,

    rawDonation: donation,

    rawAssignment:
      relatedAssignment || null,
  };
}

export default function AdminDonations() {
  const navigate = useNavigate();
  const toast = useToast();

  const [donations, setDonations] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [typeFilter, setTypeFilter] =
    useState('all');

  const [sortBy, setSortBy] =
    useState('newest');

  const [selected, setSelected] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDonations() {
      try {
        setLoading(true);
        setError('');

        /*
         * Load real database data.
         */
        const [
          donationsResponse,
          usersResponse,
          assignmentsResponse,
          ngosResponse,
          volunteersResponse,
        ] = await Promise.all([
          donationService.getAll(),
          apiClient.get('/api/users/'),
          apiClient.get('/api/assignments/'),
          apiClient.get('/api/ngos'),
          apiClient.get('/api/volunteers/'),
        ]);

        if (cancelled) return;

        const donationData =
          getArray(
            donationsResponse
          );

        const users =
          getArray(usersResponse);

        const assignments =
          getArray(
            assignmentsResponse
          );

        const ngos =
          getArray(ngosResponse);

        const volunteers =
          getArray(
            volunteersResponse
          );

        const normalized =
          donationData.map(
            (donation) =>
              normalizeDonation(
                donation,
                users,
                assignments,
                ngos,
                volunteers
              )
          );

        setDonations(normalized);
      } catch (err) {
        console.error(
          'Failed to load donations:',
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to load donations.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDonations();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = [...donations];

    if (search.trim()) {
      const q = search
        .toLowerCase()
        .trim();

      result = result.filter(
        (donation) =>
          String(
            donation.foodName || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            donation.donor || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            donation.location || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            donation.foodType || ''
          )
            .toLowerCase()
            .includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(
        (donation) =>
          donation.status ===
          statusFilter
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(
        (donation) =>
          donation.foodType ===
          typeFilter
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return String(
          a.foodName || ''
        ).localeCompare(
          String(b.foodName || '')
        );
      }

      const dateA = new Date(
        a.postedAt || 0
      ).getTime();

      const dateB = new Date(
        b.postedAt || 0
      ).getTime();

      if (sortBy === 'newest') {
        return dateB - dateA;
      }

      return dateA - dateB;
    });

    return result;
  }, [
    donations,
    search,
    statusFilter,
    typeFilter,
    sortBy,
  ]);

  const foodTypes = useMemo(
    () =>
      [
        ...new Set(
          donations
            .map(
              (donation) =>
                donation.foodType
            )
            .filter(Boolean)
        ),
      ],
    [donations]
  );

  async function handleDelete() {
    if (!deleteTarget?.donationId) {
      return;
    }

    try {
      setDeleting(true);

      /*
       * REAL DATABASE DELETE
       */
      await donationService.delete(
        deleteTarget.donationId
      );

      /*
       * Remove it from the page after
       * the backend confirms deletion.
       */
      setDonations((previous) =>
        previous.filter(
          (donation) =>
            Number(
              donation.donationId
            ) !==
            Number(
              deleteTarget.donationId
            )
        )
      );

      setDeleteTarget(null);

      /*
       * If the details modal was showing
       * the deleted donation, close it.
       */
      setSelected((previous) => {
        if (
          previous?.donationId ===
          deleteTarget.donationId
        ) {
          return null;
        }

        return previous;
      });

      toast.success(
        'Donation deleted successfully.'
      );
    } catch (err) {
      console.error(
        'Failed to delete donation:',
        err
      );

      toast.error(
        err?.message ||
          'Failed to delete donation.'
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Donations
          </h1>

          <p className="admin-page-header__subtitle">
            Manage all food donations
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
          Loading donations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Donations
          </h1>

          <p className="admin-page-header__subtitle">
            Manage all food donations
          </p>
        </div>

        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color:
              'var(--color-text-secondary)',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">
          Donations
        </h1>

        <p className="admin-page-header__subtitle">
          Manage all food donations
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
                placeholder="Search donations..."
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
          {/* Status */}
          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="POSTED">
              Posted
            </option>

            <option value="MATCHED">
              Matched
            </option>

            <option value="ASSIGNED">
              Assigned
            </option>

            <option value="PICKED_UP">
              Picked Up
            </option>

            <option value="IN_TRANSIT">
              In Transit
            </option>

            <option value="DELIVERED">
              Delivered
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

          {/* Food Type */}
          <select
            className="admin-filter-select"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Types
            </option>

            {foodTypes.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
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
          {filtered.length} donations
        </span>
      </div>

      {/* Donations */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No donations found"
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
                  <th>Food</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Donor</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (donation) => (
                    <tr
                      key={
                        donation.donationId
                      }
                    >
                      <td className="data-table__id">
                        #
                        {
                          donation.donationId
                        }
                      </td>

                      <td className="data-table__name">
                        {
                          donation.foodName
                        }
                      </td>

                      <td>
                        {
                          donation.foodType
                        }
                      </td>

                      <td>
                        {donation.quantity ??
                          '—'}{' '}
                        {donation.unit}
                      </td>

                      <td>
                        {donation.donor ||
                          '—'}
                      </td>

                      <td>
                        {
                          donation.location
                        }
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            donation.status
                          }
                          size="sm"
                        />
                      </td>

                      <td>
                        {formatDate(
                          donation.postedAt
                        )}
                      </td>

                      <td>
                        <div className="data-table__actions">
                          <button
                            className="data-table__action"
                            onClick={() =>
                              setSelected(
                                donation
                              )
                            }
                            aria-label="View donation"
                          >
                            <Eye size={16} />
                          </button>

                          {(
                            [
                              'IN_TRANSIT',
                              'PICKED_UP',
                            ].includes(
                              donation.status
                            )
                          ) && (
                            <button
                              className="data-table__action"
                              onClick={() =>
                                navigate(
                                  '/admin/deliveries'
                                )
                              }
                              aria-label="Track delivery"
                            >
                              <Truck
                                size={16}
                              />
                            </button>
                          )}

                          <button
                            className="data-table__action data-table__action--danger"
                            onClick={() =>
                              setDeleteTarget(
                                donation
                              )
                            }
                            aria-label="Delete donation"
                          >
                            <Trash2
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
              (donation) => (
                <div
                  key={
                    donation.donationId
                  }
                  className="data-card"
                >
                  <div className="data-card__header">
                    <div>
                      <div className="data-card__title">
                        {
                          donation.foodName
                        }
                      </div>

                      <div className="data-card__id">
                        #
                        {
                          donation.donationId
                        }
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        donation.status
                      }
                      size="sm"
                    />
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Type
                    </span>

                    <span className="data-card__value">
                      {
                        donation.foodType
                      }
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Quantity
                    </span>

                    <span className="data-card__value">
                      {donation.quantity ??
                        '—'}{' '}
                      {donation.unit}
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Donor
                    </span>

                    <span className="data-card__value">
                      {donation.donor ||
                        '—'}
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Location
                    </span>

                    <span className="data-card__value">
                      {
                        donation.location
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
                          donation
                        )
                      }
                    >
                      View
                    </Button>

                    {(
                      [
                        'IN_TRANSIT',
                        'PICKED_UP',
                      ].includes(
                        donation.status
                      )
                    ) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={Truck}
                        onClick={() =>
                          navigate(
                            '/admin/deliveries'
                          )
                        }
                      >
                        Track
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={Trash2}
                      onClick={() =>
                        setDeleteTarget(
                          donation
                        )
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Donation Details */}
      <Modal
        open={!!selected}
        onClose={() =>
          setSelected(null)
        }
        title="Donation Details"
        size="md"
      >
        {selected && (
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-row__label">
                Donation ID
              </span>

              <span className="detail-row__value">
                #{selected.donationId}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Status
              </span>

              <span className="detail-row__value">
                <StatusBadge
                  status={
                    selected.status
                  }
                  size="sm"
                />
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Food Name
              </span>

              <span className="detail-row__value">
                {selected.foodName}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Food Type
              </span>

              <span className="detail-row__value">
                {selected.foodType}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Quantity
              </span>

              <span className="detail-row__value">
                {selected.quantity ??
                  '—'}{' '}
                {selected.unit}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Donor
              </span>

              <span className="detail-row__value">
                {selected.donor ||
                  '—'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                NGO
              </span>

              <span className="detail-row__value">
                {selected.ngo ||
                  '—'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Volunteer
              </span>

              <span className="detail-row__value">
                {selected.volunteer ||
                  '—'}
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Location
              </span>

              <span className="detail-row__value">
                {selected.location}
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Posted At
              </span>

              <span className="detail-row__value">
                {formatDate(
                  selected.postedAt
                )}
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Expiry Time
              </span>

              <span className="detail-row__value">
                {selected.expiryTime
                  ? formatDate(
                      selected.expiryTime
                    )
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        title="Delete Donation"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setDeleteTarget(null)
              }
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              loading={deleting}
              leftIcon={Trash2}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p
            style={{
              color:
                'var(--color-text-secondary)',
              fontSize:
                'var(--text-sm)',
            }}
          >
            Delete donation{' '}
            <strong
              style={{
                color:
                  'var(--color-text)',
              }}
            >
              {
                deleteTarget.foodName
              }
            </strong>{' '}
            (#
            {
              deleteTarget.donationId
            }
            )? This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}