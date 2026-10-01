import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';
import { cn } from '../utils/cn';

export default function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div className={cn('error-state', className)} role="alert">
      <div className="error-state__icon">
        <AlertTriangle size={40} />
      </div>
      <h3 className="error-state__title">{title}</h3>
      <p className="error-state__message">
        {message || 'Unable to connect to MealBridge server. Please try again.'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
