import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  Calendar,
} from 'lucide-react';

import StatCard from '../../components/StatCard';
import AssignmentCard from '../../components/AssignmentCard';
import EmptyState from '../../components/EmptyState';

import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { useNow } from '../../hooks/useNow';

import {
  getGreeting,
  formatDay,
  formatTime,
} from '../../utils/formatDate';

import { cn } from '../../utils/cn';
import { apiClient } from '../../services/apiClient';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { location } = useLocationContext();
  const now = useNow();
  const navigate = useNavigate();

  const [available, setAvailable] = useState(true);

  const [assignments, setAssignments] = useState([]);
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);

  const firstName =
    user?.name?.split(' ')[0] || 'Volunteer';

  const greeting = getGreeting(now);

  // =========================================================
  // LOAD REAL DATABASE DATA
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [
          volunteerData,
          assignmentData,
        ] = await Promise.all([
          apiClient.get('/api/volunteers/me'),
          apiClient.get('/api/assignments/'),
        ]);

        setVolunteer(volunteerData);

        setAssignments(
          Array.isArray(assignmentData)
            ? assignmentData
            : []
        );

        // Use database availability
        if (volunteerData?.availability) {
          setAvailable(
            String(
              volunteerData.availability
            ).toUpperCase() === 'AVAILABLE'
          );
        }
      } catch (error) {
        console.error(
          'Failed to load volunteer dashboard:',
          error
        );

        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // =========================================================
  // DATABASE ASSIGNMENT COUNTS
  // =========================================================

  const todayAssignments = assignments.filter(
    (assignment) =>
      !['DELIVERED', 'CANCELLED'].includes(
        String(
          assignment.status || ''
        ).toUpperCase()
      )
  );

  const activeDelivery = assignments.find(
    (assignment) =>
      ['PICKED_UP', 'IN_TRANSIT'].includes(
        String(
          assignment.status || ''
        ).toUpperCase()
      )
  );

  const completed = assignments.filter(
    (assignment) =>
      String(
        assignment.status || ''
      ).toUpperCase() === 'DELIVERED'
  );

  const successfulPickups = assignments.filter(
    (assignment) =>
      [
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
      ].includes(
        String(
          assignment.status || ''
        ).toUpperCase()
      )
  );

  // =========================================================
  // UPDATE AVAILABILITY
  // =========================================================

  const handleAvailabilityChange = async () => {
    const newAvailable = !available;

    try {
      await apiClient.put(
        '/api/volunteers/me',
        {
          availability: newAvailable
            ? 'AVAILABLE'
            : 'UNAVAILABLE',
        }
      );

      setAvailable(newAvailable);

      setVolunteer((previous) => ({
        ...previous,
        availability: newAvailable
          ? 'AVAILABLE'
          : 'UNAVAILABLE',
      }));
    } catch (error) {
      console.error(
        'Failed to update availability:',
        error
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className="container"
        style={{
          paddingTop: 'var(--space-6)',
        }}
      >
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
      }}
    >

      {/* =====================================================
          GREETING
      ===================================================== */}

      <div className="dashboard-greeting">
        <div className="dashboard-greeting__text">

          <h1>
            {greeting}, {firstName}!
          </h1>

          <p>

            <span className="dashboard-greeting__meta-item">
              <Clock size={14} />
              {formatDay(now)}, {formatTime(now)}
            </span>

            <span className="dashboard-greeting__meta-item">
              <MapPin size={14} />

              {volunteer?.current_location ||
                location?.label ||
                'Location not available'}
            </span>

          </p>
        </div>

        {/* Availability */}

        <button
          className={cn(
            'availability-toggle',

            available
              ? 'availability-toggle--available'
              : 'availability-toggle--unavailable'
          )}

          onClick={handleAvailabilityChange}
        >
          <span className="availability-toggle__dot" />

          <span className="availability-toggle__label">
            {available
              ? 'Available'
              : 'Unavailable'}
          </span>
        </button>
      </div>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="dashboard-stats stagger">

        <StatCard
          icon={Calendar}
          label="Today's Assignments"
          value={todayAssignments.length}
          color="primary"
        />

        <StatCard
          icon={Truck}
          label="Active Delivery"
          value={activeDelivery ? 1 : 0}
          color="accent"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completed.length}
          color="success"
        />

        <StatCard
          icon={Package}
          label="Successful Pickups"
          value={successfulPickups.length}
          color="secondary"
        />

      </div>


      {/* =====================================================
          ACTIVE DELIVERY
      ===================================================== */}

      {activeDelivery && (

        <div
          style={{
            marginBottom: 'var(--space-8)',
          }}
        >

          <div className="section__header">

            <div>

              <h2 className="section__title">
                Active Delivery
              </h2>

              <p className="section__subtitle">
                Your current delivery in progress
              </p>

            </div>

          </div>


          <div className="grid grid--auto">

            <AssignmentCard
              assignment={activeDelivery}

              onViewDetails={() =>
                navigate(
                  `/volunteer/assignments/${activeDelivery.assignment_id}`
                )
              }

              onViewRoute={() =>
                navigate(
                  `/volunteer/tracking/${activeDelivery.assignment_id}`
                )
              }
            />

          </div>

        </div>

      )}


      {/* =====================================================
          TODAY'S ASSIGNMENTS
      ===================================================== */}

      <div
        style={{
          marginBottom: 'var(--space-8)',
        }}
      >

        <div className="section__header">

          <div>

            <h2 className="section__title">
              Today's Assignments
            </h2>

            <p className="section__subtitle">
              Available and active assignments for today
            </p>

          </div>

          <button
            className="section__link"
            onClick={() =>
              navigate(
                '/volunteer/assignments'
              )
            }
          >
            View All
          </button>

        </div>


        {todayAssignments.length === 0 ? (

          <EmptyState
            icon={Package}
            title="No active assignments"
            message="New assignments will appear here when you receive a delivery assignment."
          />

        ) : (

          <div className="grid grid--auto stagger">

            {todayAssignments.map(
              (assignment) => (

                <AssignmentCard
                  key={
                    assignment.assignment_id
                  }

                  assignment={assignment}

                  onAccept={() =>
                    navigate(
                      `/volunteer/assignments/${assignment.assignment_id}`
                    )
                  }

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

              )
            )}

          </div>

        )}

      </div>


      {/* =====================================================
          COMPLETED DELIVERIES
      ===================================================== */}

      {completed.length > 0 && (

        <div>

          <div className="section__header">

            <div>

              <h2 className="section__title">
                Completed Deliveries
              </h2>

              <p className="section__subtitle">
                Recently completed assignments
              </p>

            </div>

          </div>


          <div className="grid grid--auto stagger">

            {completed.map(
              (assignment) => (

                <AssignmentCard
                  key={
                    assignment.assignment_id
                  }

                  assignment={assignment}

                  onViewDetails={() =>
                    navigate(
                      `/volunteer/assignments/${assignment.assignment_id}`
                    )
                  }
                />

              )
            )}

          </div>

        </div>

      )}

    </div>
  );
}