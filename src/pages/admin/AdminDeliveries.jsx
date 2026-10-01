import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Truck,
  MapPin,
  XCircle,
  Loader2,
} from 'lucide-react';

import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import MapView from '../../components/MapView';

import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import { formatDateTime } from '../../utils/formatDate';

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

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
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

  return Number.isNaN(number) ? value : number;
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

  const userId = getValue(
    volunteer,
    'user_id',
    'userId'
  );

  if (userId) {
    const user = users.find(
      (item) =>
        Number(
          getValue(item, 'user_id', 'id')
        ) === Number(userId)
    );

    return getUserName(user);
  }

  return null;
}

function getCoordinates(item) {
  if (!item) return null;

  const latitude = Number(
    getValue(
      item,
      'latitude',
      'lat'
    )
  );

  const longitude = Number(
    getValue(
      item,
      'longitude',
      'lng',
      'lon'
    )
  );

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function normalizeDonation(donation) {
  if (!donation) return null;

  return {
    id: normalizeId(
      getValue(
        donation,
        'donation_id',
        'id'
      )
    ),

    foodName:
      getValue(
        donation,
        'food_name',
        'foodName',
        'name'
      ) || 'Food Donation',

    foodType:
      getValue(
        donation,
        'food_type',
        'foodType',
        'category'
      ) || '—',

    quantity: getValue(
      donation,
      'quantity'
    ),

    unit:
      getValue(
        donation,
        'unit'
      ) || '',

    donorId: normalizeId(
      getValue(
        donation,
        'donor_id',
        'donorId'
      )
    ),

    pickupLocation:
      getValue(
        donation,
        'pickup_location',
        'pickupLocation',
        'location'
      ) || '—',

    pickupCoordinates:
      getCoordinates(donation),

    expiryTime: getValue(
      donation,
      'expiry_time',
      'expiryTime'
    ),

    status: normalizeStatus(
      getValue(
        donation,
        'status'
      )
    ),
  };
}

function normalizeAssignment(
  assignment,
  donation,
  ngo,
  volunteer,
  users
) {
  const assignmentId = normalizeId(
    getValue(
      assignment,
      'assignment_id',
      'id'
    )
  );

  const donationId = normalizeId(
    getValue(
      assignment,
      'donation_id',
      'donationId'
    )
  );

  const ngoId = normalizeId(
    getValue(
      assignment,
      'ngo_id',
      'ngoId'
    )
  );

  const volunteerId = normalizeId(
    getValue(
      assignment,
      'volunteer_id',
      'volunteerId'
    )
  );

  const donorId = donation?.donorId;

  let donor = null;

  if (donorId) {
    const donorUser = users.find(
      (user) =>
        Number(
          getValue(
            user,
            'user_id',
            'id'
          )
        ) === Number(donorId)
    );

    donor = getUserName(donorUser);
  }

  const volunteerName =
    getVolunteerName(
      volunteer,
      users
    );

  const ngoName = getNgoName(ngo);

  const pickupLocation =
    getValue(
      assignment,
      'pickup_location',
      'pickupLocation'
    ) ||
    donation?.pickupLocation ||
    '—';

  const deliveryLocation =
    getValue(
      assignment,
      'delivery_location',
      'deliveryLocation'
    ) ||
    ngoName ||
    '—';

  const pickupCoordinates =
    getCoordinates(assignment) ||
    donation?.pickupCoordinates ||
    getCoordinates(volunteer);

  const destinationCoordinates =
    getCoordinates(ngo) ||
    null;

  return {
    id: assignmentId,

    assignmentId,

    donationId,

    ngoId,

    volunteerId,

    foodName:
      donation?.foodName ||
      'Food Donation',

    foodType:
      donation?.foodType ||
      '—',

    quantity:
      donation?.quantity !== null &&
      donation?.quantity !== undefined
        ? `${donation.quantity} ${
            donation.unit || ''
          }`.trim()
        : '—',

    donor:
      donor ||
      (donorId
        ? `User #${donorId}`
        : '—'),

    ngo:
      ngoName ||
      (ngoId
        ? `NGO #${ngoId}`
        : '—'),

    volunteer:
      volunteerName ||
      (volunteerId
        ? `Volunteer #${volunteerId}`
        : '—'),

    pickupLocation,

    deliveryLocation,

    pickupTime:
      getValue(
        assignment,
        'pickup_time',
        'pickupTime'
      ),

    deliveryTime:
      getValue(
        assignment,
        'delivery_time',
        'deliveryTime'
      ),

    assignedAt:
      getValue(
        assignment,
        'assigned_at',
        'assignedAt'
      ),

    status: normalizeStatus(
      getValue(
        assignment,
        'status'
      )
    ),

    pickupCoordinates,

    destinationCoordinates,

    rawAssignment: assignment,
    rawDonation: donation,
  };
}

export default function AdminDeliveries() {
  const toast = useToast();

  const [deliveries, setDeliveries] =
    useState([]);

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [sortBy, setSortBy] =
    useState('newest');

  const [selected, setSelected] =
    useState(null);

  const [trackTarget, setTrackTarget] =
    useState(null);

  const [cancelTarget, setCancelTarget] =
    useState(null);

  const [cancelling, setCancelling] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDeliveries() {
      try {
        setLoading(true);
        setError('');

        /*
         * Get the real database records.
         */
        const [
          assignmentsResponse,
          donationsResponse,
          ngosResponse,
          volunteersResponse,
          usersResponse,
        ] = await Promise.all([
          apiClient.get('/api/assignments/'),
          apiClient.get('/api/donations/'),
          apiClient.get('/api/ngos'),
          apiClient.get('/api/volunteers/'),
          apiClient.get('/api/users/'),
        ]);

        if (cancelled) return;

        const assignments =
          getArray(
            assignmentsResponse
          );

        const donations =
          getArray(
            donationsResponse
          );

        const ngos =
          getArray(
            ngosResponse
          );

        const volunteers =
          getArray(
            volunteersResponse
          );

        const users =
          getArray(
            usersResponse
          );

        /*
         * Create quick lookup maps.
         */
        const donationMap = new Map();

        donations.forEach(
          (donation) => {
            const normalized =
              normalizeDonation(
                donation
              );

            if (normalized?.id !== null) {
              donationMap.set(
                Number(normalized.id),
                normalized
              );
            }
          }
        );

        const ngoMap = new Map();

        ngos.forEach((ngo) => {
          const id = normalizeId(
            getValue(
              ngo,
              'ngo_id',
              'id'
            )
          );

          if (id !== null) {
            ngoMap.set(
              Number(id),
              ngo
            );
          }
        });

        const volunteerMap = new Map();

        volunteers.forEach(
          (volunteer) => {
            const id = normalizeId(
              getValue(
                volunteer,
                'volunteer_id',
                'id'
              )
            );

            if (id !== null) {
              volunteerMap.set(
                Number(id),
                volunteer
              );
            }
          }
        );

        /*
         * Combine assignment data with
         * real donation / NGO / volunteer data.
         */
        const normalizedDeliveries =
          assignments.map(
            (assignment) => {
              const donationId =
                normalizeId(
                  getValue(
                    assignment,
                    'donation_id',
                    'donationId'
                  )
                );

              const ngoId =
                normalizeId(
                  getValue(
                    assignment,
                    'ngo_id',
                    'ngoId'
                  )
                );

              const volunteerId =
                normalizeId(
                  getValue(
                    assignment,
                    'volunteer_id',
                    'volunteerId'
                  )
                );

              const donation =
                donationMap.get(
                  Number(donationId)
                );

              const ngo =
                ngoMap.get(
                  Number(ngoId)
                );

              const volunteer =
                volunteerMap.get(
                  Number(volunteerId)
                );

              return normalizeAssignment(
                assignment,
                donation,
                ngo,
                volunteer,
                users
              );
            }
          );

        setDeliveries(
          normalizedDeliveries
        );
      } catch (err) {
        console.error(
          'Failed to load deliveries:',
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to load deliveries.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDeliveries();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = [...deliveries];

    if (statusFilter !== 'all') {
      result = result.filter(
        (delivery) =>
          delivery.status ===
          statusFilter
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(
        a.assignedAt || 0
      ).getTime();

      const dateB = new Date(
        b.assignedAt || 0
      ).getTime();

      if (sortBy === 'newest') {
        return dateB - dateA;
      }

      return dateA - dateB;
    });

    return result;
  }, [
    deliveries,
    statusFilter,
    sortBy,
  ]);

  async function handleCancel() {
    if (!cancelTarget?.assignmentId) {
      return;
    }

    try {
      setCancelling(true);

      /*
       * Real database update.
       */
      await apiClient.put(
        `/api/assignments/${cancelTarget.assignmentId}/status`,
        {
          status: 'CANCELLED',
        }
      );

      /*
       * Update the page using the
       * database result.
       */
      setDeliveries((previous) =>
        previous.map((delivery) =>
          delivery.assignmentId ===
          cancelTarget.assignmentId
            ? {
                ...delivery,
                status: 'CANCELLED',
              }
            : delivery
        )
      );

      setCancelTarget(null);

      /*
       * If the selected delivery was
       * also open in the details modal,
       * update its status.
       */
      setSelected((previous) => {
        if (
          previous?.assignmentId !==
          cancelTarget.assignmentId
        ) {
          return previous;
        }

        return {
          ...previous,
          status: 'CANCELLED',
        };
      });

      toast.success(
        'Delivery cancelled successfully.'
      );
    } catch (err) {
      console.error(
        'Failed to cancel delivery:',
        err
      );

      toast.error(
        err?.message ||
          'Failed to cancel delivery.'
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Deliveries
          </h1>

          <p className="admin-page-header__subtitle">
            Operations view of all delivery
            assignments
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
          Loading deliveries...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Deliveries
          </h1>

          <p className="admin-page-header__subtitle">
            Operations view of all delivery
            assignments
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
          Deliveries
        </h1>

        <p className="admin-page-header__subtitle">
          Operations view of all delivery
          assignments
        </p>
      </div>

      {/* Filters */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
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
          </select>
        </div>

        <span className="admin-toolbar__count">
          {filtered.length} deliveries
        </span>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No deliveries found"
          message="Try adjusting your filters."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Donation</th>
                  <th>Donor</th>
                  <th>NGO</th>
                  <th>Volunteer</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (delivery) => (
                    <tr
                      key={
                        delivery.assignmentId
                      }
                    >
                      <td className="data-table__id">
                        #
                        {
                          delivery.assignmentId
                        }
                      </td>

                      <td className="data-table__name">
                        {
                          delivery.foodName
                        }
                      </td>

                      <td>
                        {delivery.donor}
                      </td>

                      <td>
                        {delivery.ngo}
                      </td>

                      <td>
                        {delivery.volunteer ||
                          '—'}
                      </td>

                      <td>
                        {
                          delivery.pickupLocation
                        }
                      </td>

                      <td>
                        {
                          delivery.deliveryLocation
                        }
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            delivery.status
                          }
                          size="sm"
                        />
                      </td>

                      <td>
                        {formatDateTime(
                          delivery.assignedAt
                        )}
                      </td>

                      <td>
                        <div className="data-table__actions">
                          <button
                            className="data-table__action"
                            onClick={() =>
                              setSelected(
                                delivery
                              )
                            }
                            aria-label="View delivery"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="data-table__action"
                            onClick={() =>
                              setTrackTarget(
                                delivery
                              )
                            }
                            aria-label="Track delivery"
                          >
                            <MapPin size={16} />
                          </button>

                          {delivery.status !==
                            'DELIVERED' &&
                            delivery.status !==
                              'CANCELLED' && (
                              <button
                                className="data-table__action data-table__action--danger"
                                onClick={() =>
                                  setCancelTarget(
                                    delivery
                                  )
                                }
                                aria-label="Cancel delivery"
                              >
                                <XCircle
                                  size={16}
                                />
                              </button>
                            )}
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
              (delivery) => (
                <div
                  key={
                    delivery.assignmentId
                  }
                  className="data-card"
                >
                  <div className="data-card__header">
                    <div>
                      <div className="data-card__title">
                        {
                          delivery.foodName
                        }
                      </div>

                      <div className="data-card__id">
                        #
                        {
                          delivery.assignmentId
                        }
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        delivery.status
                      }
                      size="sm"
                    />
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Donor
                    </span>

                    <span className="data-card__value">
                      {delivery.donor}
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      NGO
                    </span>

                    <span className="data-card__value">
                      {delivery.ngo}
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Volunteer
                    </span>

                    <span className="data-card__value">
                      {
                        delivery.volunteer ||
                        '—'
                      }
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Pickup
                    </span>

                    <span className="data-card__value">
                      {
                        delivery.pickupLocation
                      }
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Delivery
                    </span>

                    <span className="data-card__value">
                      {
                        delivery.deliveryLocation
                      }
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Assigned
                    </span>

                    <span className="data-card__value">
                      {formatDateTime(
                        delivery.assignedAt
                      )}
                    </span>
                  </div>

                  <div className="data-card__actions">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={Eye}
                      onClick={() =>
                        setSelected(
                          delivery
                        )
                      }
                    >
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={MapPin}
                      onClick={() =>
                        setTrackTarget(
                          delivery
                        )
                      }
                    >
                      Route
                    </Button>

                    {delivery.status !==
                      'DELIVERED' &&
                      delivery.status !==
                        'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={XCircle}
                          onClick={() =>
                            setCancelTarget(
                              delivery
                            )
                          }
                        >
                          Cancel
                        </Button>
                      )}
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* View Details */}
      <Modal
        open={!!selected}
        onClose={() =>
          setSelected(null)
        }
        title="Delivery Details"
        size="md"
      >
        {selected && (
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-row__label">
                Delivery ID
              </span>

              <span className="detail-row__value">
                #{selected.assignmentId}
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
                Donation ID
              </span>

              <span className="detail-row__value">
                #{selected.donationId}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Food
              </span>

              <span className="detail-row__value">
                {selected.foodName}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Quantity
              </span>

              <span className="detail-row__value">
                {selected.quantity}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Donor
              </span>

              <span className="detail-row__value">
                {selected.donor}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                NGO
              </span>

              <span className="detail-row__value">
                {selected.ngo}
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

            <div className="detail-row">
              <span className="detail-row__label">
                Pickup Location
              </span>

              <span className="detail-row__value">
                {
                  selected.pickupLocation
                }
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Delivery Location
              </span>

              <span className="detail-row__value">
                {
                  selected.deliveryLocation
                }
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Pickup Time
              </span>

              <span className="detail-row__value">
                {selected.pickupTime
                  ? formatDateTime(
                      selected.pickupTime
                    )
                  : '—'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Delivery Time
              </span>

              <span className="detail-row__value">
                {selected.deliveryTime
                  ? formatDateTime(
                      selected.deliveryTime
                    )
                  : '—'}
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Assigned At
              </span>

              <span className="detail-row__value">
                {formatDateTime(
                  selected.assignedAt
                )}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Route Modal */}
      <Modal
        open={!!trackTarget}
        onClose={() =>
          setTrackTarget(null)
        }
        title="Delivery Route"
        size="lg"
      >
        {trackTarget && (
          <>
            {trackTarget.pickupCoordinates &&
            trackTarget.destinationCoordinates ? (
              <MapView
                center={
                  trackTarget.pickupCoordinates
                }
                zoom={12}
                pickup={
                  trackTarget.pickupCoordinates
                }
                destination={
                  trackTarget.destinationCoordinates
                }
                route={[
                  [
                    trackTarget
                      .pickupCoordinates
                      .latitude,
                    trackTarget
                      .pickupCoordinates
                      .longitude,
                  ],
                  [
                    trackTarget
                      .destinationCoordinates
                      .latitude,
                    trackTarget
                      .destinationCoordinates
                      .longitude,
                  ],
                ]}
                height="360px"
              />
            ) : (
              <div
                style={{
                  padding:
                    'var(--space-6)',
                  textAlign: 'center',
                }}
              >
                <MapPin
                  size={32}
                  style={{
                    marginBottom:
                      'var(--space-3)',
                  }}
                />

                <p
                  style={{
                    marginBottom:
                      'var(--space-2)',
                    fontWeight: 600,
                  }}
                >
                  Location coordinates
                  are not available
                </p>

                <p
                  style={{
                    color:
                      'var(--color-text-secondary)',
                    fontSize:
                      'var(--text-sm)',
                  }}
                >
                  Pickup:{' '}
                  {
                    trackTarget.pickupLocation
                  }
                  <br />
                  Delivery:{' '}
                  {
                    trackTarget.deliveryLocation
                  }
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Cancel Confirmation */}
      <Modal
        open={!!cancelTarget}
        onClose={() =>
          setCancelTarget(null)
        }
        title="Cancel Delivery"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setCancelTarget(null)
              }
            >
              Close
            </Button>

            <Button
              variant="danger"
              loading={cancelling}
              leftIcon={XCircle}
              onClick={handleCancel}
            >
              Cancel Delivery
            </Button>
          </>
        }
      >
        {cancelTarget && (
          <p
            style={{
              color:
                'var(--color-text-secondary)',
              fontSize:
                'var(--text-sm)',
            }}
          >
            Cancel delivery{' '}
            <strong
              style={{
                color:
                  'var(--color-text)',
              }}
            >
              {cancelTarget.foodName}
            </strong>{' '}
            (#
            {cancelTarget.assignmentId}
            )?
          </p>
        )}
      </Modal>
    </div>
  );
}