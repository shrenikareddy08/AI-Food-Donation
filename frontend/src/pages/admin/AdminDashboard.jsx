import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  Building2,
  Bike,
  Truck,
  ScrollText,
  TrendingUp,
  CheckCircle2,
  Activity,
  Loader2,
} from 'lucide-react';

import StatCard from '../../components/StatCard';
import { BarChart, DonutChart, HBarChart } from '../../components/Charts';
import { apiClient } from '../../services/apiClient';

const QUICK_ACTIONS = [
  {
    to: '/admin/users',
    label: 'Manage Users',
    desc: 'View & manage accounts',
    icon: Users,
    color: 'primary',
  },
  {
    to: '/admin/donations',
    label: 'Manage Donations',
    desc: 'Track all donations',
    icon: Package,
    color: 'accent',
  },
  {
    to: '/admin/ngos',
    label: 'Manage NGOs',
    desc: 'Verify & manage NGOs',
    icon: Building2,
    color: 'success',
  },
  {
    to: '/admin/volunteers',
    label: 'Manage Volunteers',
    desc: 'Volunteer roster',
    icon: Bike,
    color: 'primary',
  },
  {
    to: '/admin/deliveries',
    label: 'Manage Deliveries',
    desc: 'Active & completed',
    icon: Truck,
    color: 'accent',
  },
  {
    to: '/admin/audit-logs',
    label: 'Audit Logs',
    desc: 'System activity',
    icon: ScrollText,
    color: 'success',
  },
];

function getArray(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;

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
  return String(value || '').trim().toUpperCase();
}

function getMonthLabel(date) {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
  });
}

function createMonthlyData(items, dateKeys) {
  const months = [];

  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString('en-US', {
        month: 'short',
      }),
      value: 0,
    });
  }

  items.forEach((item) => {
    let dateValue = null;

    for (const key of dateKeys) {
      if (item?.[key]) {
        dateValue = item[key];
        break;
      }
    }

    if (!dateValue) return;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return;

    const month = months.find(
      (m) =>
        m.year === date.getFullYear() &&
        m.month === date.getMonth()
    );

    if (month) {
      month.value += 1;
    }
  });

  return months.map((item) => ({
    label: item.label,
    value: item.value,
  }));
}

function createCountData(items, key) {
  const counts = {};

  items.forEach((item) => {
    const value = getValue(item, key);

    if (!value) return;

    const label = String(value).toUpperCase();

    counts[label] = (counts[label] || 0) + 1;
  });

  return Object.entries(counts).map(
    ([label, value]) => ({
      label,
      value,
    })
  );
}

function createFoodCategoryData(donations) {
  const counts = {};

  donations.forEach((donation) => {
    const type = getValue(
      donation,
      'food_type',
      'foodType',
      'category',
      'type'
    );

    if (!type) return;

    const label = String(type);

    counts[label] = (counts[label] || 0) + 1;
  });

  return Object.entries(counts).map(
    ([label, value]) => ({
      label,
      value,
    })
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError('');

        const [
          usersResponse,
          donationsResponse,
          ngosResponse,
          volunteersResponse,
          assignmentsResponse,
        ] = await Promise.all([
          apiClient.get('/api/users/'),
          apiClient.get('/api/donations/'),
          apiClient.get('/api/ngos'),
          apiClient.get('/api/volunteers/'),
          apiClient.get('/api/assignments/'),
        ]);

        if (cancelled) return;

        setUsers(getArray(usersResponse));
        setDonations(getArray(donationsResponse));
        setNgos(getArray(ngosResponse));
        setVolunteers(getArray(volunteersResponse));
        setAssignments(getArray(assignmentsResponse));
      } catch (err) {
        console.error(
          'Failed to load admin dashboard:',
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to load dashboard data.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          minHeight: '300px',
        }}
      >
        <Loader2 size={22} />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-page-header__title">
            Dashboard
          </h1>

          <p className="admin-page-header__subtitle">
            Operations overview and analytics
          </p>
        </div>

        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  /*
   * ==============================
   * REAL DATABASE STATISTICS
   * ==============================
   */

  const totalUsers = users.length;

  const totalDonors = users.filter(
    (user) =>
      normalizeStatus(
        getValue(user, 'role')
      ) === 'DONOR'
  ).length;

  const totalNgos = ngos.length;

  const totalVolunteers = volunteers.length;

  const totalDonations = donations.length;

  const activeDeliveries = assignments.filter(
    (assignment) => {
      const status = normalizeStatus(
        getValue(assignment, 'status')
      );

      return [
        'ASSIGNED',
        'PICKED_UP',
        'IN_TRANSIT',
      ].includes(status);
    }
  ).length;

  const completedDeliveries = assignments.filter(
    (assignment) =>
      normalizeStatus(
        getValue(assignment, 'status')
      ) === 'DELIVERED'
  ).length;

  /*
   * ==============================
   * CHART DATA FROM DATABASE
   * ==============================
   */

  const donationsOverTime = createMonthlyData(
    donations,
    [
      'created_at',
      'createdAt',
      'posted_at',
      'postedAt',
    ]
  );

  const deliveriesOverTime = createMonthlyData(
    assignments,
    [
      'assigned_at',
      'assignedAt',
      'created_at',
      'createdAt',
    ]
  );

  const foodCategories =
    createFoodCategoryData(donations);

  const usersByRole = createCountData(
    users,
    'role'
  );

  const donationStatus = createCountData(
    donations,
    'status'
  );

  const deliveryStatus = createCountData(
    assignments,
    'status'
  );

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">
          Dashboard
        </h1>

        <p className="admin-page-header__subtitle">
          Operations overview and analytics
        </p>
      </div>

      {/* Statistics */}
      <div className="admin-stats-grid">
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers}
          color="primary"
        />

        <StatCard
          icon={TrendingUp}
          label="Total Donors"
          value={totalDonors}
          color="success"
        />

        <StatCard
          icon={Building2}
          label="Total NGOs"
          value={totalNgos}
          color="accent"
        />

        <StatCard
          icon={Bike}
          label="Total Volunteers"
          value={totalVolunteers}
          color="secondary"
        />

        <StatCard
          icon={Package}
          label="Total Donations"
          value={totalDonations}
          color="primary"
        />

        <StatCard
          icon={Activity}
          label="Active Deliveries"
          value={activeDeliveries}
          color="warning"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed Deliveries"
          value={completedDeliveries}
          color="success"
        />
      </div>

      {/* Quick Actions */}
      <h2
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
        }}
      >
        Quick Actions
      </h2>

      <div className="admin-quick-actions">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.to}
              to={action.to}
              className="admin-quick-action"
            >
              <span
                className={`admin-quick-action__icon admin-quick-action__icon--${action.color}`}
              >
                <Icon size={22} />
              </span>

              <div>
                <div className="admin-quick-action__label">
                  {action.label}
                </div>

                <div className="admin-quick-action__desc">
                  {action.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics */}
      <h2
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
        }}
      >
        Analytics
      </h2>

      <div className="admin-charts">
        {/* Donations Over Time */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-card__title">
            Donations Over Time
          </h3>

          <BarChart
            data={donationsOverTime}
          />
        </div>

        {/* Deliveries Over Time */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-card__title">
            Deliveries Over Time
          </h3>

          <BarChart
            data={deliveriesOverTime}
            color="accent"
          />
        </div>

        {/* Food Categories */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-card__title">
            Food Categories
          </h3>

          {foodCategories.length > 0 ? (
            <DonutChart
              data={foodCategories}
            />
          ) : (
            <p>No food category data available.</p>
          )}
        </div>

        {/* Users by Role */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-card__title">
            Users by Role
          </h3>

          {usersByRole.length > 0 ? (
            <DonutChart
              data={usersByRole}
              size={140}
            />
          ) : (
            <p>No user data available.</p>
          )}
        </div>

        {/* Donation Status */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-card__title">
            Donation Status
          </h3>

          {donationStatus.length > 0 ? (
            <HBarChart
              data={donationStatus}
            />
          ) : (
            <p>No donation status data available.</p>
          )}
        </div>

        {/* Delivery Status */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-card__title">
            Delivery Status
          </h3>

          {deliveryStatus.length > 0 ? (
            <HBarChart
              data={deliveryStatus}
            />
          ) : (
            <p>No delivery status data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}