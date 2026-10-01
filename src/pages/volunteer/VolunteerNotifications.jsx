import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, BellOff } from 'lucide-react';
import NotificationItem from '../../components/NotificationItem';
import EmptyState from '../../components/EmptyState';
import Tabs from '../../components/Tabs';
import { MOCK_NOTIFICATIONS } from '../../utils/mockData';

export default function VolunteerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ];

  const filtered = activeTab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-9)' }}>
      <div className="section__header">
        <div>
          <h1 className="page-header__title">Notifications</h1>
          <p className="page-header__subtitle">Assignment updates and delivery alerts</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary-500)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} style={{ marginBottom: 'var(--space-6)' }} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          message="You're all caught up! New assignment notifications will appear here."
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
