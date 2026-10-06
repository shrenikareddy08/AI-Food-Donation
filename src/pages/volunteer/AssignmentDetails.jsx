import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  MapPin,
  Package,
  User,
  Navigation,
  Clock,
  CheckCircle,
  Loader2,
  Phone,
} from 'lucide-react';

import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import { apiClient } from '../../services/apiClient';

export default function AssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.get(`/api/assignments/${id}`);
      setAssignment(data);
    } catch (err) {
      console.error('Failed to load assignment:', err);
      setError(err?.message || 'Assignment not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      await apiClient.post(`/api/assignments/${id}/accept`);
      await loadAssignment();
    } catch (err) {
      console.error('Failed to accept assignment:', err);
      alert(err?.message || 'Could not accept assignment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          paddingTop: 'var(--space-8)',
        }}
      >
        <Loader2 size={32} className="animate-spin" />
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading assignment #{id}...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'var(--space-6)',
        }}
      >
        <Card>
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
            }}
          >
            <Package
              size={48}
              style={{
                marginBottom: 'var(--space-4)',
                opacity: 0.5,
              }}
            />

            <h2 style={{ marginBottom: 'var(--space-2)' }}>
              Assignment not found
            </h2>

            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {error || 'The requested assignment could not be found.'}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
              }}
            >
              <Button
                type="button"
                variant="outline"
                leftIcon={ArrowLeft}
                onClick={() => navigate('/volunteer/assignments')}
              >
                Back to Assignments
              </Button>

              <Button
                type="button"
                variant="primary"
                leftIcon={LayoutDashboard}
                onClick={() => navigate('/volunteer/dashboard')}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const assignmentId = assignment.assignment_id || assignment.id || id;
  const foodName = assignment.food_name || assignment.foodName || 'Food Donation';
  const foodType = assignment.food_type || assignment.foodType || 'Prepared Meals';
  const quantity = assignment.quantity ?? null;
  const unit = assignment.unit || 'servings';
  const status = String(assignment.status || 'PENDING').toUpperCase();

  const donorName = assignment.donor_name || assignment.donor || 'Food Donor';
  const donorPhone = assignment.donor_phone || assignment.donorPhone || 'Not specified';
  const pickupLocation = assignment.pickup_location || 'Donor Location';

  const ngoName = assignment.ngo_name || assignment.ngo || 'Partner Organization';
  const ngoPhone = assignment.ngo_phone || assignment.ngoPhone || 'Not specified';
  const deliveryLocation = assignment.delivery_location || 'NGO Facility';

  const pickupTimeStr = assignment.pickup_time
    ? new Date(assignment.pickup_time).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Immediate / As scheduled';

  // Default coordinate anchors for Hyderabad if coordinates not provided
  const pickupPosition = { latitude: 17.4485, longitude: 78.3748 };
  const destinationPosition = { latitude: 17.4375, longitude: 78.4482 };

  const mapMarkers = [
    {
      id: 'pickup',
      latitude: pickupPosition.latitude,
      longitude: pickupPosition.longitude,
      label: `Pickup - ${pickupLocation}`,
    },
    {
      id: 'destination',
      latitude: destinationPosition.latitude,
      longitude: destinationPosition.longitude,
      label: `Destination - ${deliveryLocation}`,
    },
  ];

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--space-6)',
      }}
    >
      {/* Top navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/volunteer/assignments')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back to Assignments
        </button>

        <Button
          type="button"
          variant="outline"
          leftIcon={LayoutDashboard}
          onClick={() => navigate('/volunteer/dashboard')}
        >
          Dashboard
        </Button>
      </div>

      {/* Page heading */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                color: 'var(--color-text-tertiary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Assignment #{assignmentId}
            </p>

            <h1 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>
              {foodName}
            </h1>

            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Food pickup and redistribution delivery
            </p>
          </div>

          <StatusBadge status={status} />
        </div>
      </div>

      {/* Main content grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(300px, 1fr)',
          gap: 'var(--space-5)',
        }}
      >
        {/* Left side */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {/* Food Details */}
          <Card>
            <div style={{ padding: 'var(--space-5)' }}>
              <h2 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                Food Details
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <p
                    style={{
                      color: 'var(--color-text-tertiary)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: '4px',
                    }}
                  >
                    Food Item
                  </p>
                  <p style={{ fontWeight: 600, margin: 0 }}>{foodName}</p>
                </div>

                <div>
                  <p
                    style={{
                      color: 'var(--color-text-tertiary)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: '4px',
                    }}
                  >
                    Category
                  </p>
                  <p style={{ fontWeight: 600, margin: 0 }}>{foodType}</p>
                </div>

                <div>
                  <p
                    style={{
                      color: 'var(--color-text-tertiary)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: '4px',
                    }}
                  >
                    Quantity
                  </p>
                  <p style={{ fontWeight: 600, margin: 0 }}>
                    {quantity !== null ? `${quantity} ${unit}` : 'Standard portion'}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      color: 'var(--color-text-tertiary)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: '4px',
                    }}
                  >
                    Pickup Scheduled
                  </p>
                  <p style={{ fontWeight: 600, margin: 0 }}>{pickupTimeStr}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Donor Details */}
          <Card>
            <div style={{ padding: 'var(--space-5)' }}>
              <h2 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                Donor Information
              </h2>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-surface-secondary)',
                  }}
                >
                  <User size={22} />
                </div>

                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{donorName}</p>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--text-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Phone size={14} /> {donorPhone}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Route Details */}
          <Card>
            <div style={{ padding: 'var(--space-5)' }}>
              <h2 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                Route Details
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-5)',
                }}
              >
                {/* Pickup */}
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <MapPin size={22} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>Pickup Location</p>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                      {pickupLocation}
                    </p>
                  </div>
                </div>

                {/* Destination */}
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Navigation size={22} style={{ color: 'var(--color-accent-500)', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>Destination NGO</p>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                      {deliveryLocation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Map */}
          <Card>
            <div style={{ padding: 'var(--space-5)' }}>
              <h2 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                Route Map
              </h2>

              <div
                style={{
                  minHeight: '350px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                <MapView
                  pickupPosition={pickupPosition}
                  destinationPosition={destinationPosition}
                  markers={mapMarkers}
                  height="350px"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right side */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {/* NGO Details */}
          <Card>
            <div style={{ padding: 'var(--space-5)' }}>
              <h2 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                NGO Details
              </h2>

              <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                {ngoName}
              </p>

              <p
                style={{
                  margin: 0,
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {deliveryLocation}
              </p>

              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Phone size={14} /> {ngoPhone}
              </p>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div style={{ padding: 'var(--space-5)' }}>
              <h2 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                Delivery Actions
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                {/* If Waiting for volunteer */}
                {['PENDING', 'REQUESTED'].includes(status) && (
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={actionLoading}
                    onClick={handleAccept}
                  >
                    {actionLoading ? 'Claiming Request...' : 'Accept Delivery Request'}
                  </Button>
                )}

                {/* If Accepted or Assigned */}
                {['ACCEPTED', 'ASSIGNED'].includes(status) && (
                  <Link
                    to={`/volunteer/pickup/${assignmentId}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="primary" fullWidth leftIcon={CheckCircle}>
                      Start Pickup
                    </Button>
                  </Link>
                )}

                {/* If Pickup In Progress */}
                {status === 'PICKUP_IN_PROGRESS' && (
                  <Link
                    to={`/volunteer/pickup/${assignmentId}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="primary" fullWidth leftIcon={CheckCircle}>
                      Complete Food Pickup
                    </Button>
                  </Link>
                )}

                {/* If Picked Up or In Transit */}
                {['PICKED_UP', 'IN_TRANSIT'].includes(status) && (
                  <>
                    <Link
                      to={`/volunteer/delivery/${assignmentId}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="primary" fullWidth leftIcon={Package}>
                        Proceed to Delivery
                      </Button>
                    </Link>

                    <Link
                      to={`/volunteer/tracking/${assignmentId}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="outline" fullWidth leftIcon={Navigation}>
                        Track Delivery
                      </Button>
                    </Link>
                  </>
                )}

                {/* If Delivered / Completed */}
                {['DELIVERED', 'COMPLETED'].includes(status) && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 'var(--space-4)',
                      background: 'var(--color-success-50)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-success-200)',
                    }}
                  >
                    <CheckCircle
                      size={28}
                      style={{
                        color: 'var(--color-success-500)',
                        margin: '0 auto var(--space-2)',
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: 'var(--color-success-600)',
                      }}
                    >
                      Delivery Completed Successfully!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Bottom navigation */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/volunteer/assignments')}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ← Assignments
            </button>

            <button
              type="button"
              onClick={() => navigate('/volunteer/dashboard')}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}