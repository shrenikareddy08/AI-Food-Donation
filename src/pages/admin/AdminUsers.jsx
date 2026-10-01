import { useEffect, useMemo, useState } from 'react';
import { Eye, Trash2, Search } from 'lucide-react';

import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';

import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import { formatDate } from '../../utils/formatDate';

const ROLE_COLORS = {
  DONOR: { color: 'info', avatarClass: '' },
  NGO: { color: 'accent', avatarClass: 'admin-avatar--accent' },
  VOLUNTEER: { color: 'success', avatarClass: 'admin-avatar--success' },
  ADMIN: { color: 'warning', avatarClass: 'admin-avatar--neutral' },
};

function normalizeUser(user) {
  return {
    id: user.user_id ?? user.id,
    name: user.name ?? user.full_name ?? user.username ?? 'Unknown User',
    email: user.email ?? '—',
    phone: user.phone ?? user.phone_number ?? '—',
    role: String(user.role ?? '').toUpperCase(),
    location: user.location ?? user.address ?? '—',
    createdAt: user.created_at ?? user.createdAt ?? null,
  };
}

export default function AdminUsers() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.get('/api/users/');

      const userList = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
          ? data.users
          : [];

      setUsers(userList.map(normalizeUser));
    } catch (err) {
      console.error('Failed to load users:', err);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to load users.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter((u) =>
        String(u.name).toLowerCase().includes(q) ||
        String(u.email).toLowerCase().includes(q) ||
        String(u.location).toLowerCase().includes(q) ||
        String(u.phone).toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (sortBy === 'newest') {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
    }

    if (sortBy === 'oldest') {
      result.sort(
        (a, b) =>
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
      );
    }

    if (sortBy === 'name') {
      result.sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );
    }

    return result;
  }, [users, search, roleFilter, sortBy]);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      setDeleting(true);

      await apiClient.delete(
        `/api/users/${deleteTarget.id}`
      );

      setUsers((prev) =>
        prev.filter((u) => u.id !== deleteTarget.id)
      );

      toast.success(
        `User "${deleteTarget.name}" deleted successfully.`
      );

      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete user:', err);

      toast.error(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to delete user.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading users..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load users"
        message={error}
        onRetry={loadUsers}
      />
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">
          Users
        </h1>

        <p className="admin-page-header__subtitle">
          Manage all platform users
        </p>
      </div>

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
                placeholder="Search users..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="admin-toolbar__filters">
          <select
            className="admin-filter-select"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
          >
            <option value="all">All Roles</option>
            <option value="DONOR">Donor</option>
            <option value="NGO">NGO</option>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="ADMIN">Admin</option>
          </select>

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

            <option value="name">
              Name A-Z
            </option>
          </select>
        </div>

        <span className="admin-toolbar__count">
          {filtered.length} users
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          message="Try adjusting your search or filters."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const rc =
                    ROLE_COLORS[u.role] ||
                    ROLE_COLORS.DONOR;

                  return (
                    <tr key={u.id}>
                      <td className="data-table__id">
                        #{u.id}
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <span
                            className={`admin-avatar ${rc.avatarClass}`}
                          >
                            {String(u.name)
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span className="data-table__name">
                            {u.name}
                          </span>
                        </div>
                      </td>

                      <td className="data-table__email">
                        {u.email}
                      </td>

                      <td>{u.phone}</td>

                      <td>
                        <StatusBadge
                          status={u.role}
                          size="sm"
                        />
                      </td>

                      <td>{u.location}</td>

                      <td>
                        {formatDate(u.createdAt)}
                      </td>

                      <td>
                        <div className="data-table__actions">
                          <button
                            className="data-table__action"
                            onClick={() =>
                              setSelectedUser(u)
                            }
                            aria-label="View user"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="data-table__action data-table__action--danger"
                            onClick={() =>
                              setDeleteTarget(u)
                            }
                            aria-label="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="data-cards">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="data-card"
              >
                <div className="data-card__header">
                  <div>
                    <div className="data-card__title">
                      {u.name}
                    </div>

                    <div className="data-card__id">
                      #{u.id}
                    </div>
                  </div>

                  <StatusBadge
                    status={u.role}
                    size="sm"
                  />
                </div>

                <div className="data-card__row">
                  <span className="data-card__label">
                    Email
                  </span>

                  <span className="data-card__value">
                    {u.email}
                  </span>
                </div>

                <div className="data-card__row">
                  <span className="data-card__label">
                    Phone
                  </span>

                  <span className="data-card__value">
                    {u.phone}
                  </span>
                </div>

                <div className="data-card__row">
                  <span className="data-card__label">
                    Location
                  </span>

                  <span className="data-card__value">
                    {u.location}
                  </span>
                </div>

                <div className="data-card__row">
                  <span className="data-card__label">
                    Joined
                  </span>

                  <span className="data-card__value">
                    {formatDate(u.createdAt)}
                  </span>
                </div>

                <div className="data-card__actions">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={Eye}
                    onClick={() =>
                      setSelectedUser(u)
                    }
                  >
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={Trash2}
                    onClick={() =>
                      setDeleteTarget(u)
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* View User */}
      <Modal
        open={!!selectedUser}
        onClose={() =>
          setSelectedUser(null)
        }
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-row__label">
                User ID
              </span>

              <span className="detail-row__value">
                #{selectedUser.id}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Role
              </span>

              <span className="detail-row__value">
                <StatusBadge
                  status={selectedUser.role}
                  size="sm"
                />
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Name
              </span>

              <span className="detail-row__value">
                {selectedUser.name}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Email
              </span>

              <span className="detail-row__value">
                {selectedUser.email}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Phone
              </span>

              <span className="detail-row__value">
                {selectedUser.phone}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                Location
              </span>

              <span className="detail-row__value">
                {selectedUser.location}
              </span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-row__label">
                Joined
              </span>

              <span className="detail-row__value">
                {formatDate(
                  selectedUser.createdAt
                )}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User */}
      <Modal
        open={!!deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        title="Delete User"
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
              fontSize: 'var(--text-sm)',
            }}
          >
            Are you sure you want to delete user{' '}
            <strong
              style={{
                color: 'var(--color-text)',
              }}
            >
              {deleteTarget.name}
            </strong>{' '}
            ({deleteTarget.email})? This action
            cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}