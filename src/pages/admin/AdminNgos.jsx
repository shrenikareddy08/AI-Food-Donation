import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Trash2,
  Search,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Button from '../../components/Button';

import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import { ngoService } from '../../services/ngoService';
import { formatDate } from '../../utils/formatDate';

const VERIFICATION_BADGE = {
  VERIFIED: {
    status: 'DELIVERED',
    label: 'Verified',
  },
  PENDING: {
    status: 'ASSIGNED',
    label: 'Pending',
  },
  REJECTED: {
    status: 'POSTED',
    label: 'Rejected',
  },
};

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

function normalizeVerificationStatus(ngo) {
  const value = getValue(
    ngo,
    'verification_status',
    'verificationStatus',
    'status'
  );

  const status = String(value || '')
    .trim()
    .toUpperCase();

  if (status === 'VERIFIED') {
    return 'VERIFIED';
  }

  if (status === 'REJECTED') {
    return 'REJECTED';
  }

  return 'PENDING';
}

function normalizeNgo(ngo) {
  const id = normalizeId(
    getValue(
      ngo,
      'ngo_id',
      'id'
    )
  );

  const name =
    getValue(
      ngo,
      'name',
      'ngo_name',
      'ngoName',
      'organization_name',
      'organizationName'
    ) || `NGO #${id}`;

  const email =
    getValue(
      ngo,
      'email',
      'contact_email',
      'contactEmail'
    ) || '—';

  const phone =
    getValue(
      ngo,
      'phone',
      'phone_number',
      'phoneNumber',
      'contact_phone',
      'contactPhone'
    ) || '—';

  const address =
    getValue(
      ngo,
      'address',
      'full_address',
      'fullAddress'
    ) || '—';

  const location =
    getValue(
      ngo,
      'current_location',
      'currentLocation',
      'location'
    ) || address;

  const capacity =
    getValue(
      ngo,
      'capacity',
      'capacity_kg',
      'capacityKg'
    );

  const foodRequirements =
    getValue(
      ngo,
      'requirements',
      'food_requirements',
      'foodRequirements'
    ) || '—';

  const createdAt =
    getValue(
      ngo,
      'created_at',
      'createdAt'
    );

  const verificationStatus =
    normalizeVerificationStatus(ngo);

  return {
    id,

    ngoId: id,

    name,

    email,

    phone,

    address,

    location,

    capacity:
      capacity !== null
        ? `${capacity} kg`
        : '—',

    capacityValue: capacity,

    foodRequirements,

    verificationStatus,

    verified:
      verificationStatus ===
      'VERIFIED',

    createdAt,

    latitude: getValue(
      ngo,
      'latitude',
      'lat'
    ),

    longitude: getValue(
      ngo,
      'longitude',
      'lon',
      'lng'
    ),

    rawNgo: ngo,
  };
}

export default function AdminNgos() {
  const toast = useToast();

  const [ngos, setNgos] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [verifyFilter, setVerifyFilter] =
    useState('all');

  const [sortBy, setSortBy] =
    useState('newest');

  const [selected, setSelected] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [verifyTarget, setVerifyTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * Load NGOs from the real database.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadNgos() {
      try {
        setLoading(true);
        setError('');

        const response =
          await ngoService.getAll();

        if (cancelled) return;

        const data =
          getArray(response);

        const normalized =
          data.map(normalizeNgo);

        setNgos(normalized);
      } catch (err) {
        console.error(
          'Failed to load NGOs:',
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to load NGOs.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNgos();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Search, filter and sort real database data.
   */
  const filtered = useMemo(() => {
    let result = [...ngos];

    if (search.trim()) {
      const q = search
        .toLowerCase()
        .trim();

      result = result.filter(
        (ngo) =>
          String(
            ngo.name || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            ngo.email || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            ngo.phone || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            ngo.location || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            ngo.address || ''
          )
            .toLowerCase()
            .includes(q)
      );
    }

    if (verifyFilter !== 'all') {
      result = result.filter(
        (ngo) =>
          ngo.verificationStatus ===
          verifyFilter
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return String(
          a.name || ''
        ).localeCompare(
          String(b.name || '')
        );
      }

      const dateA = new Date(
        a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || 0
      ).getTime();

      if (sortBy === 'newest') {
        return dateB - dateA;
      }

      return dateA - dateB;
    });

    return result;
  }, [
    ngos,
    search,
    verifyFilter,
    sortBy,
  ]);

  /*
   * REAL DATABASE DELETE
   */
  async function handleDelete() {
    if (!deleteTarget?.ngoId) {
      return;
    }

    try {
      setDeleting(true);

      await ngoService.delete(
        deleteTarget.ngoId
      );

      /*
       * Update frontend only after
       * backend confirms deletion.
       */
      setNgos((previous) =>
        previous.filter(
          (ngo) =>
            Number(ngo.ngoId) !==
            Number(
              deleteTarget.ngoId
            )
        )
      );

      setDeleteTarget(null);

      setSelected((previous) => {
        if (
          previous?.ngoId ===
          deleteTarget.ngoId
        ) {
          return null;
        }

        return previous;
      });

      toast.success(
        `NGO "${deleteTarget.name}" deleted successfully.`
      );
    } catch (err) {
      console.error(
        'Failed to delete NGO:',
        err
      );

      toast.error(
        err?.message ||
          'Failed to delete NGO.'
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * REAL DATABASE VERIFICATION
   *
   * The backend admin verification
   * endpoint is called here.
   */
  async function handleVerify() {
    if (!verifyTarget?.ngoId) {
      return;
    }

    try {
      setVerifying(true);

      await apiClient.patch(
        `/api/ngos/${verifyTarget.ngoId}/verify`
      );

      /*
       * Update only after backend
       * confirms verification.
       */
      setNgos((previous) =>
        previous.map((ngo) =>
          Number(ngo.ngoId) ===
          Number(
            verifyTarget.ngoId
          )
            ? {
                ...ngo,
                verified: true,
                verificationStatus:
                  'VERIFIED',
              }
            : ngo
        )
      );

      /*
       * Also update the currently
       * selected NGO if necessary.
       */
      setSelected((previous) => {
        if (
          previous?.ngoId ===
          verifyTarget.ngoId
        ) {
          return {
            ...previous,
            verified: true,
            verificationStatus:
              'VERIFIED',
          };
        }

        return previous;
      });

      setVerifyTarget(null);

      toast.success(
        `NGO "${verifyTarget.name}" verified successfully.`
      );
    } catch (err) {
      console.error(
        'Failed to verify NGO:',
        err
      );

      toast.error(
        err?.message ||
          'Failed to verify NGO.'
      );
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            NGOs
          </h1>

          <p className="admin-page-header__subtitle">
            Manage and verify NGO organizations
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
          Loading NGOs...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            NGOs
          </h1>

          <p className="admin-page-header__subtitle">
            Manage and verify NGO organizations
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
          NGOs
        </h1>

        <p className="admin-page-header__subtitle">
          Manage and verify NGO organizations
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
                placeholder="Search NGOs..."
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
          <select
            className="admin-filter-select"
            value={verifyFilter}
            onChange={(e) =>
              setVerifyFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="VERIFIED">
              Verified
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="REJECTED">
              Rejected
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

            <option value="name">
              Name A-Z
            </option>
          </select>
        </div>

        <span className="admin-toolbar__count">
          {filtered.length} NGOs
        </span>
      </div>

      {/* NGO List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No NGOs found"
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
                  <th>Organization</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Verification</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (ngo) => {
                    const badge =
                      VERIFICATION_BADGE[
                        ngo.verificationStatus
                      ] ||
                      VERIFICATION_BADGE.PENDING;

                    return (
                      <tr
                        key={ngo.ngoId}
                      >
                        <td className="data-table__id">
                          #
                          {
                            ngo.ngoId
                          }
                        </td>

                        <td>
                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: 'var(--space-2)',
                            }}
                          >
                            <span className="admin-avatar admin-avatar--accent">
                              {ngo.name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </span>

                            <span className="data-table__name">
                              {
                                ngo.name
                              }
                            </span>
                          </div>
                        </td>

                        <td className="data-table__email">
                          {ngo.email}
                        </td>

                        <td>
                          {ngo.phone}
                        </td>

                        <td>
                          {ngo.location}
                        </td>

                        <td>
                          {ngo.capacity}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              badge.status
                            }
                            size="sm"
                          />
                        </td>

                        <td>
                          {formatDate(
                            ngo.createdAt
                          )}
                        </td>

                        <td>
                          <div className="data-table__actions">
                            {/* View */}
                            <button
                              className="data-table__action"
                              onClick={() =>
                                setSelected(
                                  ngo
                                )
                              }
                              aria-label="View NGO"
                            >
                              <Eye
                                size={
                                  16
                                }
                              />
                            </button>

                            {/* Verify */}
                            {ngo.verificationStatus ===
                              'PENDING' && (
                              <button
                                className="data-table__action"
                                onClick={() =>
                                  setVerifyTarget(
                                    ngo
                                  )
                                }
                                aria-label="Verify NGO"
                                style={{
                                  color:
                                    'var(--color-success-500)',
                                }}
                              >
                                <CheckCircle2
                                  size={
                                    16
                                  }
                                />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              className="data-table__action data-table__action--danger"
                              onClick={() =>
                                setDeleteTarget(
                                  ngo
                                )
                              }
                              aria-label="Delete NGO"
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="data-cards">
            {filtered.map(
              (ngo) => {
                const badge =
                  VERIFICATION_BADGE[
                    ngo.verificationStatus
                  ] ||
                  VERIFICATION_BADGE.PENDING;

                return (
                  <div
                    key={ngo.ngoId}
                    className="data-card"
                  >
                    <div className="data-card__header">
                      <div>
                        <div className="data-card__title">
                          {
                            ngo.name
                          }
                        </div>

                        <div className="data-card__id">
                          #
                          {
                            ngo.ngoId
                          }
                        </div>
                      </div>

                      <StatusBadge
                        status={
                          badge.status
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
                          ngo.email
                        }
                      </span>
                    </div>

                    <div className="data-card__row">
                      <span className="data-card__label">
                        Phone
                      </span>

                      <span className="data-card__value">
                        {
                          ngo.phone
                        }
                      </span>
                    </div>

                    <div className="data-card__row">
                      <span className="data-card__label">
                        Location
                      </span>

                      <span className="data-card__value">
                        {
                          ngo.location
                        }
                      </span>
                    </div>

                    <div className="data-card__row">
                      <span className="data-card__label">
                        Capacity
                      </span>

                      <span className="data-card__value">
                        {
                          ngo.capacity
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
                            ngo
                          )
                        }
                      >
                        View
                      </Button>

                      {ngo.verificationStatus ===
                        'PENDING' && (
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={
                            CheckCircle2
                          }
                          onClick={() =>
                            setVerifyTarget(
                              ngo
                            )
                          }
                        >
                          Verify
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={Trash2}
                        onClick={() =>
                          setDeleteTarget(
                            ngo
                          )
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}

      {/* NGO Details */}
      <Modal
        open={!!selected}
        onClose={() =>
          setSelected(null)
        }
        title="NGO Details"
        size="md"
      >
        {selected && (
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-row__label">
                NGO ID
              </span>

              <span className="detail-row__value">
                #{selected.ngoId}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Verification
              </span>

              <span className="detail-row__value">
                <StatusBadge
                  status={
                    (
                      VERIFICATION_BADGE[
                        selected
                          .verificationStatus
                      ] ||
                      VERIFICATION_BADGE.PENDING
                    ).status
                  }
                  size="sm"
                />
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
                Address
              </span>

              <span className="detail-row__value">
                {selected.address}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Location
              </span>

              <span className="detail-row__value">
                {selected.location}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Capacity
              </span>

              <span className="detail-row__value">
                {selected.capacity}
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Food Requirements
              </span>

              <span className="detail-row__value">
                {
                  selected.foodRequirements
                }
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Joined
              </span>

              <span className="detail-row__value">
                {formatDate(
                  selected.createdAt
                )}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Verify Confirmation */}
      <Modal
        open={!!verifyTarget}
        onClose={() =>
          setVerifyTarget(null)
        }
        title="Verify NGO"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setVerifyTarget(null)
              }
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              loading={verifying}
              leftIcon={
                CheckCircle2
              }
              onClick={
                handleVerify
              }
            >
              Verify
            </Button>
          </>
        }
      >
        {verifyTarget && (
          <p
            style={{
              color:
                'var(--color-text-secondary)',
              fontSize:
                'var(--text-sm)',
            }}
          >
            Verify{' '}
            <strong
              style={{
                color:
                  'var(--color-text)',
              }}
            >
              {
                verifyTarget.name
              }
            </strong>
            ? They will be marked as a
            verified NGO.
          </p>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        title="Delete NGO"
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
              onClick={
                handleDelete
              }
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
            Delete NGO{' '}
            <strong
              style={{
                color:
                  'var(--color-text)',
              }}
            >
              {
                deleteTarget.name
              }
            </strong>
            ? This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}