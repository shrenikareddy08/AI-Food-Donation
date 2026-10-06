import { useState, useEffect } from 'react';
import { Bell, CheckCheck, BellOff, RefreshCw } from 'lucide-react';
import NotificationItem from '../../components/NotificationItem';
import EmptyState from '../../components/EmptyState';
import Tabs from '../../components/Tabs';
import { notificationService } from '../../services/notificationService';

function normalizeItem(item) {
  if (!item) return null;
  const rawType = String(item.type || item.notification_type || '').toLowerCase();
  let type = 'default';
  if (rawType.includes('match') || rawType.includes('ngo')) type = 'match';
  else if (rawType.includes('assign') || rawType.includes('volunteer')) type = 'assignment';
  else if (rawType.includes('pickup')) type = 'pickup';
  else if (rawType.includes('transit')) type = 'transit';
  else if (rawType.includes('deliver')) type = 'delivered';

  return {
    id: item.notification_id ?? item.id,
    title: item.title ?? 'Notification',
    message: item.message ?? '',
    type,
    read: Boolean(item.is_read ?? item.read ?? false),
    timestamp: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  };
}

export default function NgoNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications();
      const list = Array.isArray(res) ? res : (res?.data || []);
      const normalized = list.map(normalizeItem).filter(Boolean);
      normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(normalized);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ];

  const filtered = activeTab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-9)' }}>
      <div className="section__header">
        <div>
          <h1 className="page-header__title">Notifications</h1>
          <p className="page-header__subtitle">Stay updated on your incoming donations and deliveries</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <button
            onClick={fetchNotifications}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', background: 'none', border: '1px solid var(--color-neutral-200)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} style={{ marginBottom: 'var(--space-6)' }} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--color-neutral-500)' }}>Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          message="You're all caught up! New notifications about your donations will appear here."
        />
      ) : (
        <div className="notification-list">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={handleRead} />
          ))}
        </div>
      )}
    </div>
  );
}
