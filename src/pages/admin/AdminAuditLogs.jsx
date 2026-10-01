import { useEffect, useMemo, useState } from 'react';
import { Search, ScrollText, Loader2 } from 'lucide-react';

import EmptyState from '../../components/EmptyState';
import { apiClient } from '../../services/apiClient';
import { formatDateTime } from '../../utils/formatDate';

const ACTION_COLORS = {
  DONATION_CREATED: {
    color: 'info',
    label: 'Donation Created',
  },
  DONATION_MATCHED: {
    color: 'info',
    label: 'Donation Matched',
  },
  VOLUNTEER_ASSIGNED: {
    color: 'warning',
    label: 'Volunteer Assigned',
  },
  FOOD_PICKED_UP: {
    color: 'accent',
    label: 'Food Picked Up',
  },
  DELIVERY_STARTED: {
    color: 'info',
    label: 'Delivery Started',
  },
  DELIVERY_COMPLETED: {
    color: 'success',
    label: 'Delivery Completed',
  },
  USER_REGISTERED: {
    color: 'success',
    label: 'User Registered',
  },
  PROFILE_UPDATED: {
    color: 'neutral',
    label: 'Profile Updated',
  },
};

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

function getValue(item, ...keys) {
  for (const key of keys) {
    if (
      item?.[key] !== undefined &&
      item?.[key] !== null
    ) {
      return item[key];
    }
  }

  return '';
}

function normalizeLog(log) {
  return {
    id: getValue(log, 'audit_id', 'id'),

    user:
      getValue(
        log,
        'user_name',
        'username',
        'user_email',
        'email',
        'user'
      ) || 'Unknown User',

    action: getValue(
      log,
      'action',
      'event',
      'activity'
    ),

    entityType:
      getValue(
        log,
        'entity_type',
        'entityType',
        'entity'
      ) || 'N/A',

    entityId:
      getValue(
        log,
        'entity_id',
        'entityId'
      ) || 'N/A',

    details:
      getValue(
        log,
        'details',
        'description',
        'message'
      ) || 'No details available',

    createdAt: getValue(
      log,
      'created_at',
      'createdAt',
      'timestamp'
    ),
  };
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      try {
        setLoading(true);
        setError('');

        // Correct backend endpoint
        const response = await apiClient.get(
          '/api/admin/audit-logs/'
        );

        if (cancelled) {
          return;
        }

        const data = getArray(response);

        setLogs(data.map(normalizeLog));
      } catch (err) {
        console.error(
          'Failed to load audit logs:',
          err
        );

        if (!cancelled) {
          const message =
            err?.response?.data?.detail ||
            err?.message ||
            'Failed to load audit logs.';

          setError(message);
          setLogs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = [...logs];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();

      result = result.filter((log) => {
        const user = String(
          log.user || ''
        ).toLowerCase();

        const action = String(
          log.action || ''
        ).toLowerCase();

        const entityType = String(
          log.entityType || ''
        ).toLowerCase();

        const entityId = String(
          log.entityId || ''
        ).toLowerCase();

        const details = String(
          log.details || ''
        ).toLowerCase();

        return (
          user.includes(q) ||
          action.includes(q) ||
          entityType.includes(q) ||
          entityId.includes(q) ||
          details.includes(q)
        );
      });
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter(
        (log) =>
          log.action === actionFilter
      );
    }

    // Entity filter
    if (entityFilter !== 'all') {
      result = result.filter(
        (log) =>
          log.entityType === entityFilter
      );
    }

    // Sort
    result.sort((a, b) => {
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
    logs,
    search,
    actionFilter,
    entityFilter,
    sortBy,
  ]);

  const actionTypes = useMemo(
    () =>
      [
        ...new Set(
          logs
            .map((log) => log.action)
            .filter(Boolean)
        ),
      ],
    [logs]
  );

  const entityTypes = useMemo(
    () =>
      [
        ...new Set(
          logs
            .map((log) => log.entityType)
            .filter(Boolean)
        ),
      ],
    [logs]
  );

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Audit Logs
          </h1>

          <p className="admin-page-header__subtitle">
            System activity and event history
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
          Loading audit logs...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Audit Logs
          </h1>

          <p className="admin-page-header__subtitle">
            System activity and event history
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
          Audit Logs
        </h1>

        <p className="admin-page-header__subtitle">
          System activity and event history
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
                placeholder="Search audit logs..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="admin-toolbar__filters">

          {/* Action Filter */}
          <select
            className="admin-filter-select"
            value={actionFilter}
            onChange={(e) =>
              setActionFilter(e.target.value)
            }
          >
            <option value="all">
              All Actions
            </option>

            {actionTypes.map((action) => (
              <option
                key={action}
                value={action}
              >
                {ACTION_COLORS[action]?.label ||
                  action}
              </option>
            ))}
          </select>

          {/* Entity Filter */}
          <select
            className="admin-filter-select"
            value={entityFilter}
            onChange={(e) =>
              setEntityFilter(e.target.value)
            }
          >
            <option value="all">
              All Entities
            </option>

            {entityTypes.map((type) => (
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
              setSortBy(e.target.value)
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
          {filtered.length} entries
        </span>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit logs found"
          message="Try adjusting your search or filters."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((log) => {
                  const actionConfig =
                    ACTION_COLORS[
                      log.action
                    ] || {
                      color: 'neutral',
                      label:
                        log.action ||
                        'Unknown Action',
                    };

                  return (
                    <tr key={log.id}>
                      <td className="data-table__id">
                        #{log.id}
                      </td>

                      <td className="data-table__name">
                        {log.user}
                      </td>

                      <td>
                        <span
                          className={`status-badge status-badge--${actionConfig.color} status-badge--sm`}
                        >
                          {actionConfig.label}
                        </span>
                      </td>

                      <td>
                        {log.entityType}
                      </td>

                      <td className="data-table__id">
                        #{log.entityId}
                      </td>

                      <td
                        style={{
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={log.details}
                      >
                        {log.details}
                      </td>

                      <td
                        style={{
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateTime(
                          log.createdAt
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="data-cards">
            {filtered.map((log) => {
              const actionConfig =
                ACTION_COLORS[
                  log.action
                ] || {
                  color: 'neutral',
                  label:
                    log.action ||
                    'Unknown Action',
                };

              return (
                <div
                  key={log.id}
                  className="data-card"
                >
                  <div className="data-card__header">
                    <div>
                      <div className="data-card__title">
                        {log.user}
                      </div>

                      <div className="data-card__id">
                        #{log.id}
                      </div>
                    </div>

                    <span
                      className={`status-badge status-badge--${actionConfig.color} status-badge--sm`}
                    >
                      {actionConfig.label}
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Entity
                    </span>

                    <span className="data-card__value">
                      {log.entityType} #
                      {log.entityId}
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Details
                    </span>

                    <span
                      className="data-card__value"
                      style={{
                        fontSize:
                          'var(--text-xs)',
                      }}
                    >
                      {log.details}
                    </span>
                  </div>

                  <div className="data-card__row">
                    <span className="data-card__label">
                      Time
                    </span>

                    <span className="data-card__value">
                      {formatDateTime(
                        log.createdAt
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}