import {
  Handshake, UserCheck, PackageCheck, Truck, CheckCircle2,
  Bell, FileText, ClipboardCheck,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { timeAgo } from '../utils/formatDate';

const TYPE_CONFIG = {
  match: { icon: Handshake, color: 'info' },
  assignment: { icon: UserCheck, color: 'warning' },
  pickup: { icon: PackageCheck, color: 'accent' },
  transit: { icon: Truck, color: 'info' },
  delivered: { icon: CheckCircle2, color: 'success' },
  new_assignment: { icon: FileText, color: 'info' },
  default: { icon: Bell, color: 'neutral' },
};

const COLOR_CLASSES = {
  info: 'notification-item__icon--info',
  warning: 'notification-item__icon--warning',
  accent: 'notification-item__icon--accent',
  success: 'notification-item__icon--success',
  neutral: 'notification-item__icon--neutral',
};

export default function NotificationItem({ notification, onRead, onClick }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.default;
  const Icon = config.icon;

  return (
    <div
      className={cn('notification-item', !notification.read && 'notification-item--unread')}
      onClick={() => {
        onClick?.(notification);
        if (!notification.read) onRead?.(notification.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(notification);
          if (!notification.read) onRead?.(notification.id);
        }
      }}
    >
      <div className={cn('notification-item__icon', COLOR_CLASSES[config.color])}>
        <Icon size={18} />
      </div>
      <div className="notification-item__content">
        <div className="notification-item__header">
          <span className="notification-item__title">{notification.title}</span>
          {!notification.read && <span className="notification-item__dot" />}
        </div>
        <p className="notification-item__message">{notification.message}</p>
        <span className="notification-item__time">{timeAgo(notification.timestamp)}</span>
      </div>
    </div>
  );
}
