import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import { apiClient } from '../../services/apiClient';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError('');

        // Correct backend endpoint
        const data = await apiClient.get(
          '/api/notifications/me'
        );

        if (!cancelled) {
          setNotifications(
            Array.isArray(data) ? data : []
          );
        }
      } catch (err) {
        console.error(
          'Failed to load admin notifications:',
          err
        );

        if (!cancelled) {
          setNotifications([]);

          setError(
            err?.response?.data?.detail ||
              err?.message ||
              'Failed to load notifications.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.put(
        `/api/notifications/${notificationId}/read`,
        {
          is_read: true,
        }
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.notification_id ===
          notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error
      );
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-header__title">
          Notifications
        </h1>

        <p className="page-header__subtitle">
          View your latest notifications
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-6) 0',
          }}
        >
          <Loader2 size={20} />
          Loading notifications...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
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
      )}

      {/* No Notifications */}
      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
            }}
          >
            <Bell
              size={40}
              style={{
                marginBottom: 'var(--space-3)',
              }}
            />

            <h3>No notifications</h3>

            <p
              style={{
                color:
                  'var(--color-text-secondary)',
              }}
            >
              You don't have any notifications yet.
            </p>
          </div>
        )}

      {/* Notifications */}
      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            {notifications.map((notification) => (
              <div
                key={
                  notification.notification_id
                }
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start',
                  padding: 'var(--space-4)',
                  borderRadius:
                    'var(--radius-lg)',
                  background:
                    'var(--color-surface)',
                  border:
                    '1px solid var(--color-border)',
                  opacity:
                    notification.is_read
                      ? 0.75
                      : 1,
                }}
              >
                <Bell size={20} />

                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom:
                        'var(--space-1)',
                    }}
                  >
                    {notification.title ||
                      'Notification'}
                  </div>

                  <div
                    style={{
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >
                    {notification.message ||
                      notification.content ||
                      'You have a new notification.'}
                  </div>

                  {notification.created_at && (
                    <div
                      style={{
                        marginTop:
                          'var(--space-2)',
                        fontSize:
                          'var(--text-xs)',
                        color:
                          'var(--color-text-secondary)',
                      }}
                    >
                      {new Date(
                        notification.created_at
                      ).toLocaleString()}
                    </div>
                  )}

                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() =>
                        markAsRead(
                          notification.notification_id
                        )
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop:
                          'var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0,
                        color:
                          'var(--color-primary)',
                      }}
                    >
                      <CheckCircle2
                        size={16}
                      />

                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}