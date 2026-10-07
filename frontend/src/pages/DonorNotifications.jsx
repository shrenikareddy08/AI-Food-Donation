import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Package,
  RefreshCw,
  Truck,
  Building2,
  UserRound,
  AlertCircle,
  Info,
} from 'lucide-react';

import { notificationService } from '../services/notificationService';
import LocationHeader from '../components/LocationHeader';
import { useNow } from '../hooks/useNow';
import {
  formatDay,
  formatTime,
} from '../utils/formatDate';

import '../styles/donor-notifications.css';


// =========================================================
// HELPERS
// =========================================================

function normalizeNotification(item) {
  if (!item) {
    return null;
  }

  return {
    id:
      item.notification_id ??
      item.id ??
      item.notificationId,

    title:
      item.title ??
      item.subject ??
      'MealBridge Notification',

    message:
      item.message ??
      item.description ??
      item.body ??
      'You have a new notification.',

    type:
      String(
        item.type ??
        item.notification_type ??
        item.notificationType ??
        item.event_type ??
        'INFO'
      ).toUpperCase(),

    read:
      Boolean(
        item.is_read ??
        item.read ??
        item.isRead ??
        false
      ),

    createdAt:
      item.created_at ??
      item.createdAt ??
      item.timestamp ??
      null,
  };
}


function formatNotificationDate(value) {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


function getNotificationIcon(type) {
  const value = String(type).toUpperCase();

  if (
    value.includes('DONATION') ||
    value.includes('FOOD')
  ) {
    return Package;
  }

  if (
    value.includes('MATCH') ||
    value.includes('NGO')
  ) {
    return Building2;
  }

  if (
    value.includes('ASSIGN') ||
    value.includes('VOLUNTEER')
  ) {
    return UserRound;
  }

  if (
    value.includes('DELIVERY') ||
    value.includes('PICKUP') ||
    value.includes('TRANSIT')
  ) {
    return Truck;
  }

  if (
    value.includes('ALERT') ||
    value.includes('WARNING')
  ) {
    return AlertCircle;
  }

  return Info;
}


function getNotificationIconClass(type) {
  const value = String(type).toUpperCase();

  if (
    value.includes('DELIVERY') ||
    value.includes('PICKUP') ||
    value.includes('TRANSIT')
  ) {
    return 'donor-notification-icon--delivery';
  }

  if (
    value.includes('MATCH') ||
    value.includes('NGO')
  ) {
    return 'donor-notification-icon--ngo';
  }

  if (
    value.includes('ASSIGN') ||
    value.includes('VOLUNTEER')
  ) {
    return 'donor-notification-icon--volunteer';
  }

  if (
    value.includes('ALERT') ||
    value.includes('WARNING')
  ) {
    return 'donor-notification-icon--alert';
  }

  return 'donor-notification-icon--default';
}


// =========================================================
// COMPONENT
// =========================================================

export default function DonorNotifications() {
  const now = useNow();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    filter,
    setFilter,
  ] = useState('ALL');


  // =======================================================
  // LOAD NOTIFICATIONS
  // =======================================================

  async function loadNotifications(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response =
        await notificationService.getMyNotifications();

      const rawList =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

      const normalized =
        rawList
          .map(normalizeNotification)
          .filter(Boolean)
          .sort(
            (a, b) => {
              const first =
                a.createdAt
                  ? new Date(
                      a.createdAt
                    ).getTime()
                  : 0;

              const second =
                b.createdAt
                  ? new Date(
                      b.createdAt
                    ).getTime()
                  : 0;

              return second - first;
            }
          );

      setNotifications(normalized);

    } catch (err) {
      console.error(
        'Failed to load notifications:',
        err
      );

      setNotifications([]);

      setError(
        err?.message ||
        'Unable to load notifications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadNotifications();
  }, []);


  // =======================================================
  // MARK ONE AS READ
  // =======================================================

  async function markAsRead(notification) {
    if (
      !notification?.id ||
      notification.read
    ) {
      return;
    }

    try {
      await notificationService.markAsRead(
        notification.id
      );

      setNotifications(
        (current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  read: true,
                }
              : item
          )
      );

    } catch (err) {
      console.error(
        'Failed to mark notification as read:',
        err
      );
    }
  }


  // =======================================================
  // MARK ALL AS READ
  // =======================================================

  async function markAllAsRead() {
    const unread =
      notifications.filter(
        (item) => !item.read
      );

    if (unread.length === 0) {
      return;
    }

    try {
      await notificationService.markAllAsRead();

      setNotifications(
        (current) =>
          current.map((item) => ({
            ...item,
            read: true,
          }))
      );

      await loadNotifications(true);

    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      );
    }
  }


  // =======================================================
  // FILTERED NOTIFICATIONS
  // =======================================================

  const filteredNotifications =
    useMemo(() => {
      if (filter === 'UNREAD') {
        return notifications.filter(
          (item) => !item.read
        );
      }

      if (filter === 'READ') {
        return notifications.filter(
          (item) => item.read
        );
      }

      return notifications;
    }, [
      notifications,
      filter,
    ]);


  // =======================================================
  // COUNTS
  // =======================================================

  const unreadCount =
    notifications.filter(
      (item) => !item.read
    ).length;


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="donor-notifications-page">

      <div className="donor-notifications-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="donor-notifications-hero">

          <div className="donor-notifications-hero-content">

            <div className="donor-notifications-eyebrow">
              <Bell size={15} />
              Updates & alerts
            </div>

            <h1>
              Notifications
            </h1>

            <p>
              Stay updated about your donations,
              NGO responses, pickups and deliveries.
            </p>

          </div>


          <div className="donor-notifications-hero-actions">

            <button
              type="button"
              className="donor-notifications-refresh"
              onClick={() =>
                loadNotifications(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? 'donor-notification-spin'
                    : ''
                }
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </button>

          </div>

        </section>


        {/* =================================================
            DATE / LOCATION
        ================================================= */}

        <section className="donor-notifications-meta">

          <div className="donor-notifications-time">

            <Clock3 size={16} />

            <span>
              {formatDay(now)}
            </span>

            <strong>
              {formatTime(now)}
            </strong>

          </div>

          <LocationHeader />

        </section>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="donor-notifications-summary">

          <div className="donor-notifications-summary-card">

            <div className="donor-notifications-summary-icon">
              <Bell size={21} />
            </div>

            <div>
              <span>
                Total notifications
              </span>

              <strong>
                {notifications.length}
              </strong>
            </div>

          </div>


          <div className="donor-notifications-summary-card">

            <div className="donor-notifications-summary-icon donor-notifications-summary-icon--unread">
              <Info size={21} />
            </div>

            <div>
              <span>
                Unread
              </span>

              <strong>
                {unreadCount}
              </strong>
            </div>

          </div>


          <div className="donor-notifications-summary-action">

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={17} />
              Mark all as read
            </button>

          </div>

        </section>


        {/* =================================================
            FILTER
        ================================================= */}

        <section className="donor-notifications-controls">

          <div className="donor-notifications-filter">

            <button
              type="button"
              className={
                filter === 'ALL'
                  ? 'donor-notifications-filter-btn donor-notifications-filter-btn--active'
                  : 'donor-notifications-filter-btn'
              }
              onClick={() =>
                setFilter('ALL')
              }
            >
              All
              <span>
                {notifications.length}
              </span>
            </button>


            <button
              type="button"
              className={
                filter === 'UNREAD'
                  ? 'donor-notifications-filter-btn donor-notifications-filter-btn--active'
                  : 'donor-notifications-filter-btn'
              }
              onClick={() =>
                setFilter('UNREAD')
              }
            >
              Unread
              <span>
                {unreadCount}
              </span>
            </button>


            <button
              type="button"
              className={
                filter === 'READ'
                  ? 'donor-notifications-filter-btn donor-notifications-filter-btn--active'
                  : 'donor-notifications-filter-btn'
              }
              onClick={() =>
                setFilter('READ')
              }
            >
              Read
              <span>
                {notifications.length -
                  unreadCount}
              </span>
            </button>

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="donor-notifications-error">

            <AlertCircle size={19} />

            <div>
              <strong>
                Unable to load notifications
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                loadNotifications()
              }
            >
              Try again
            </button>

          </div>
        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="donor-notifications-state">

            <RefreshCw
              size={29}
              className="donor-notification-spin"
            />

            <h2>
              Loading notifications
            </h2>

            <p>
              Getting your latest MealBridge updates.
            </p>

          </div>
        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredNotifications.length === 0 && (

            <div className="donor-notifications-state">

              <div className="donor-notifications-empty-icon">
                <Bell size={34} />
              </div>

              <h2>
                {notifications.length === 0
                  ? 'No notifications yet'
                  : 'No notifications in this filter'}
              </h2>

              <p>
                {notifications.length === 0
                  ? 'You will see donation and delivery updates here.'
                  : 'Try another filter to see your notifications.'}
              </p>

            </div>
          )}


        {/* =================================================
            LIST
        ================================================= */}

        {!loading &&
          !error &&
          filteredNotifications.length > 0 && (

            <section className="donor-notifications-list">

              <div className="donor-notifications-list-header">

                <div>

                  <span>
                    YOUR UPDATES
                  </span>

                  <h2>
                    Recent activity
                  </h2>

                </div>

                <strong>
                  {filteredNotifications.length}{' '}
                  {filteredNotifications.length === 1
                    ? 'notification'
                    : 'notifications'}
                </strong>

              </div>


              <div className="donor-notifications-items">

                {filteredNotifications.map(
                  (notification) => {

                    const Icon =
                      getNotificationIcon(
                        notification.type
                      );

                    const iconClass =
                      getNotificationIconClass(
                        notification.type
                      );

                    return (
                      <article
                        key={notification.id}
                        className={
                          notification.read
                            ? 'donor-notification-item donor-notification-item--read'
                            : 'donor-notification-item donor-notification-item--unread'
                        }
                        onClick={() =>
                          markAsRead(
                            notification
                          )
                        }
                      >

                        {/* ICON */}

                        <div
                          className={`donor-notification-icon ${iconClass}`}
                        >
                          <Icon size={21} />
                        </div>


                        {/* CONTENT */}

                        <div className="donor-notification-content">

                          <div className="donor-notification-title-row">

                            <h3>
                              {notification.title}
                            </h3>

                            {!notification.read && (
                              <span className="donor-notification-new">
                                NEW
                              </span>
                            )}

                          </div>


                          <p>
                            {notification.message}
                          </p>


                          <div className="donor-notification-time">

                            <Clock3 size={14} />

                            <span>
                              {formatNotificationDate(
                                notification.createdAt
                              )}
                            </span>

                          </div>

                        </div>


                        {/* READ STATUS */}

                        <div className="donor-notification-read">

                          {notification.read ? (
                            <Check
                              size={17}
                            />
                          ) : (
                            <span />
                          )}

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            </section>
          )}

      </div>

    </div>
  );
}