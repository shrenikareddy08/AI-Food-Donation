import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export default function LoadingSpinner({ size = 32, label, className, fullPage = false }) {
  const spinner = (
    <div className={cn('loading-spinner', className)} role="status" aria-live="polite">
      <Loader2 size={size} className="loading-spinner__icon animate-spin" />
      {label && <span className="loading-spinner__label">{label}</span>}
    </div>
  );

  if (fullPage) {
    return <div className="loading-spinner__page">{spinner}</div>;
  }
  return spinner;
}
