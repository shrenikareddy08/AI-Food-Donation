import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  MapPin,
  Package,
  User,
  Navigation,
  Clock,
  CheckCircle,
} from 'lucide-react';

import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';

import { MOCK_ASSIGNMENTS } from '../../utils/mockData';

export default function AssignmentDetails() {
  const { id } = useParams();

  const assignment = MOCK_ASSIGNMENTS.find(
    (item) => String(item.id) === String(id)
  );

  /*
   * Assignment not found
   */
  if (!assignment) {
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

            <h2
              style={{
                marginBottom: 'var(--space-2)',
              }}
            >
              Assignment not found
            </h2>

            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-5)',
              }}
            >
              The requested assignment could not be found.
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
                onClick={() => {
                  window.location.href =
                    '/volunteer/assignments';
                }}
              >
                Back to Assignments
              </Button>

              <Button
                type="button"
                variant="primary"
                leftIcon={LayoutDashboard}
                onClick={() => {
                  window.location.href =
                    '/volunteer/dashboard';
                }}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const pickup = assignment.pickup || {};
  const destination = assignment.destination || {};

  const pickupPosition =
    pickup.latitude !== undefined &&
    pickup.longitude !== undefined
      ? {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        }
      : null;

  const destinationPosition =
    destination.latitude !== undefined &&
    destination.longitude !== undefined
      ? {
          latitude: destination.latitude,
          longitude: destination.longitude,
        }
      : null;

  const mapMarkers = [];

  if (pickupPosition) {
    mapMarkers.push({
      id: 'pickup',
      latitude: pickupPosition.latitude,
      longitude: pickupPosition.longitude,
      label: `Pickup - ${
        pickup.label ||
        assignment.pickupArea ||
        'Pickup'
      }`,
    });
  }

  if (destinationPosition) {
    mapMarkers.push({
      id: 'destination',
      latitude: destinationPosition.latitude,
      longitude: destinationPosition.longitude,
      label: `Destination - ${
        destination.label ||
        assignment.destinationArea ||
        'Destination'
      }`,
    });
  }

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
        {/* Back to Assignments */}
        <button
          type="button"
          onClick={() => {
            window.location.href =
              '/volunteer/assignments';
          }}
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

        {/* Dashboard */}
        <Button
          type="button"
          variant="outline"
          leftIcon={LayoutDashboard}
          onClick={() => {
            window.location.href =
              '/volunteer/dashboard';
          }}
        >
          Dashboard
        </Button>
      </div>

      {/* Page heading */}
      <div
        style={{
          marginBottom: 'var(--space-6)',
        }}
      >
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
              Assignment #{assignment.id}
            </p>

            <h1
              style={{
                margin: 0,
                marginBottom: 'var(--space-2)',
              }}
            >
              {assignment.foodName}
            </h1>

            <p
              style={{
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Food pickup and delivery assignment
            </p>
          </div>

          <StatusBadge status={assignment.status} />
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1.5fr) minmax(300px, 1fr)',
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
            <div
              style={{
                padding: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 'var(--space-4)',
                }}
              >
                Food Details
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(180px, 1fr))',
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
                    Food
                  </p>

                  <p
                    style={{
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {assignment.foodName}
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
                    Type
                  </p>

                  <p
                    style={{
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {assignment.foodType}
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
                    Quantity
                  </p>

                  <p
                    style={{
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {assignment.quantity} {assignment.unit}
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
                    Pickup Time
                  </p>

                  <p
                    style={{
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {assignment.pickupTime}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Donor Details */}
          <Card>
            <div
              style={{
                padding: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 'var(--space-4)',
                }}
              >
                Donor Details
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
                    background:
                      'var(--color-surface-secondary)',
                  }}
                >
                  <User size={22} />
                </div>

                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                    }}
                  >
                    {assignment.donor}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    {assignment.donorPhone}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Route Details */}
          <Card>
            <div
              style={{
                padding: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 'var(--space-4)',
                }}
              >
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
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                  }}
                >
                  <MapPin size={22} />

                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      Pickup
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color:
                          'var(--color-text-secondary)',
                      }}
                    >
                      {assignment.pickupArea},{' '}
                      {assignment.pickupCity}
                    </p>
                  </div>
                </div>

                {/* Destination */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                  }}
                >
                  <Navigation size={22} />

                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      Destination
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color:
                          'var(--color-text-secondary)',
                      }}
                    >
                      {assignment.destinationArea},{' '}
                      {assignment.destinationCity}
                    </p>
                  </div>
                </div>

                {/* Distance / ETA */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-5)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Navigation size={18} />
                    <span>
                      {assignment.distanceKm} km
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Clock size={18} />
                    <span>
                      {assignment.etaMinutes} min ETA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Map */}
          <Card>
            <div
              style={{
                padding: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 'var(--space-4)',
                }}
              >
                Route Map
              </h2>

              {pickupPosition ||
              destinationPosition ? (
                <div
                  style={{
                    minHeight: '350px',
                    borderRadius:
                      'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <MapView
                    pickupPosition={pickupPosition}
                    destinationPosition={
                      destinationPosition
                    }
                    markers={mapMarkers}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: 'var(--space-6)',
                    textAlign: 'center',
                    color:
                      'var(--color-text-secondary)',
                  }}
                >
                  Location information is not
                  available.
                </div>
              )}
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
            <div
              style={{
                padding: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 'var(--space-4)',
                }}
              >
                NGO Details
              </h2>

              <p
                style={{
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {assignment.ngo}
              </p>

              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {assignment.ngoAddress}
              </p>
            </div>
          </Card>

          {/* Notes */}
          {assignment.notes && (
            <Card>
              <div
                style={{
                  padding: 'var(--space-5)',
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom:
                      'var(--space-3)',
                  }}
                >
                  Notes
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      'var(--color-text-secondary)',
                  }}
                >
                  {assignment.notes}
                </p>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <div
              style={{
                padding: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom:
                    'var(--space-4)',
                }}
              >
                Actions
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <Link
                  to={`/volunteer/pickup/${assignment.id}`}
                  style={{
                    textDecoration: 'none',
                  }}
                >
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={CheckCircle}
                  >
                    Pickup
                  </Button>
                </Link>

                <Link
                  to={`/volunteer/delivery/${assignment.id}`}
                  style={{
                    textDecoration: 'none',
                  }}
                >
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={Package}
                  >
                    Delivery
                  </Button>
                </Link>

                <Link
                  to={`/volunteer/tracking/${assignment.id}`}
                  style={{
                    textDecoration: 'none',
                  }}
                >
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={Navigation}
                  >
                    Track Delivery
                  </Button>
                </Link>
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
              onClick={() => {
                window.location.href =
                  '/volunteer/assignments';
              }}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '12px 16px',
                borderRadius:
                  'var(--radius-md)',
                border:
                  '1px solid var(--color-border)',
                background:
                  'var(--color-surface)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ← Assignments
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  '/volunteer/dashboard';
              }}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '12px 16px',
                borderRadius:
                  'var(--radius-md)',
                border:
                  '1px solid var(--color-border)',
                background:
                  'var(--color-surface)',
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