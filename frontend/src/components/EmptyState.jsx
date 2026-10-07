import { cn } from '../utils/cn';

export default function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={cn('empty-state', className)}>
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={40} />
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
