import { STATUS_CONFIG } from '../utils/constants';
import { cn } from '../utils/cn';

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'neutral' };
  return (
    <span className={cn('status-badge', `status-badge--${config.color}`, `status-badge--${size}`)}>
      <span className="status-badge__dot" />
      {config.label}
    </span>
  );
}
