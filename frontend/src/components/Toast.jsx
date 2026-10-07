import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export default function Toast({ type = 'info', message, onClose }) {
  const Icon = ICONS[type] || Info;
  return (
    <div className={cn('toast', `toast--${type}`)} role="alert">
      <span className="toast__icon">
        <Icon size={18} />
      </span>
      <span className="toast__message">{message}</span>
      {onClose && (
        <button className="toast__close" onClick={onClose} aria-label="Dismiss">
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}
