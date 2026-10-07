import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Loader2 } from 'lucide-react';

import AssignmentCard from '../../components/AssignmentCard';
import EmptyState from '../../components/EmptyState';
import Tabs from '../../components/Tabs';
import { apiClient } from '../../services/apiClient';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

function filterByTab(assignments, tab) {
  switch (tab) {
    case 'pending':
      return assignments.filter(
        (a) =>
          ['PENDING', 'REQUESTED'].includes(String(a.status || '').toUpperCase())
      );

    case 'accepted':
      return assignments.filter(
        (a) =>
          ['ASSIGNED', 'ACCEPTED'].includes(String(a.status || '').toUpperCase())
      );

    case 'active':
      return assignments.filter(
        (a) => {
          const status = String(
            a.status || ''
          ).toUpperCase();

          return (
            status === 'PICKUP_IN_PROGRESS' ||
            status === 'PICKED_UP' ||
            status === 'IN_TRANSIT'
          );
        }
      );

    case 'completed':
      return assignments.filter(
        (a) =>
          ['DELIVERED', 'COMPLETED'].includes(String(a.status || '').toUpperCase())
      );

    default:
      return assignments;
  }
}

export default function Assignments() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await apiClient.get('/api/assignments/');

      setAssignments(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        'Failed to load volunteer assignments:',
        err
      );

      setError(
        err?.message ||
        'Failed to load assignments.'
      );
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const tabs = STATUS_TABS.map((tab) => ({
    ...tab,
    count: filterByTab(
      assignments,
      tab.id
    ).length,
  }));

  const filtered = filterByTab(
    assignments,
    activeTab
  );

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-9)',
      }}
    >
      <div className="page-header">
        <h1 className="page-header__title">
          My Assignments
        </h1>

        <p className="page-header__subtitle">
          Manage your pickup and delivery assignments
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        style={{
          marginBottom: 'var(--space-6)',
        }}
      />

      {loading ? (
        <div
          style={{
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Loader2
            size={22}
            className="animate-spin"
          />
          <span>Loading assignments...</span>
        </div>
      ) : error ? (
        <EmptyState
          icon={Package}
          title="Unable to load assignments"
          message={error}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assignments"
          message="New assignments will appear here when you're matched with a donation."
        />
      ) : (
        <div className="grid grid--auto stagger">
          {filtered.map((assignment) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              onAccept={async () => {
                try {
                  await apiClient.post(`/api/assignments/${assignment.assignment_id}/accept`);
                  await loadAssignments();
                  navigate(`/volunteer/assignments/${assignment.assignment_id}`);
                } catch (acceptErr) {
                  console.error('Accept assignment error:', acceptErr);
                  navigate(`/volunteer/assignments/${assignment.assignment_id}`);
                }
              }}
              onViewDetails={() =>
                navigate(
                  `/volunteer/assignments/${assignment.assignment_id}`
                )
              }
              onViewRoute={() =>
                navigate(
                  `/volunteer/tracking/${assignment.assignment_id}`
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}