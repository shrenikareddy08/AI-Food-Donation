import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Bike,
  CheckCircle2,
  LogOut,
  Truck,
} from 'lucide-react';

import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

export default function VolunteerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [volunteer, setVolunteer] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const [volunteerData, assignmentData] =
          await Promise.all([
            apiClient.get('/api/volunteers/me'),
            apiClient.get('/api/assignments/'),
          ]);

        setVolunteer(volunteerData);
        setAssignments(
          Array.isArray(assignmentData)
            ? assignmentData
            : []
        );
      } catch (error) {
        console.error(
          'Failed to load volunteer profile:',
          error
        );

        setVolunteer(null);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const initials = (
    user?.name ||
    'V'
  )
    .charAt(0)
    .toUpperCase();

  // Completed deliveries from database
  const completedDeliveries = assignments.filter(
    (assignment) =>
      String(assignment.status || '').toUpperCase() ===
      'DELIVERED'
  ).length;

  // Successful pickups from database
  const successfulPickups = assignments.filter(
    (assignment) =>
      [
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
      ].includes(
        String(assignment.status || '').toUpperCase()
      )
  ).length;

  if (loading) {
    return (
      <div
        className="container"
        style={{
          paddingTop: 'var(--space-6)',
        }}
      >
        <p>Loading profile...</p>
      </div>
    );
  }

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
          My Profile
        </h1>

        <p className="page-header__subtitle">
          Manage your volunteer account
        </p>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {initials}
        </div>

        <div className="profile-header__info">
          <span className="profile-header__role">
            Volunteer
          </span>

          <h1>
            {user?.name || 'Volunteer'}
          </h1>

          <span className="profile-header__verified">
            <CheckCircle2 size={16} />
            Active Volunteer
          </span>
        </div>
      </div>

      {/* Profile Details */}
      <div className="profile-details">

        {/* Email */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Mail
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Email
          </span>

          <span className="profile-detail-item__value">
            {user?.email || 'Not available'}
          </span>
        </div>

        {/* Phone */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Phone
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Phone
          </span>

          <span className="profile-detail-item__value">
            {user?.phone || 'Not available'}
          </span>
        </div>

        {/* Location */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <MapPin
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Location
          </span>

          <span className="profile-detail-item__value">
            {volunteer?.current_location ||
              'Not available'}
          </span>
        </div>

        {/* Vehicle */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Bike
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Vehicle
          </span>

          <span className="profile-detail-item__value">
            {volunteer?.vehicle_type ||
              'Not available'}

            {volunteer?.vehicle_number
              ? ` - ${volunteer.vehicle_number}`
              : ''}
          </span>
        </div>

        {/* Availability */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <CheckCircle2
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Availability
          </span>

          <span className="profile-detail-item__value">
            {volunteer?.availability ||
              'Not available'}
          </span>
        </div>

        {/* Completed Deliveries */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Truck
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Completed Deliveries
          </span>

          <span className="profile-detail-item__value">
            {completedDeliveries}
          </span>
        </div>

        {/* Successful Pickups */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <CheckCircle2
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Successful Pickups
          </span>

          <span className="profile-detail-item__value">
            {successfulPickups}
          </span>
        </div>

      </div>

      {/* Logout */}
      <div className="profile-actions">
        <Button
          variant="danger"
          fullWidth
          leftIcon={LogOut}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}