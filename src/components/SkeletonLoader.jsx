import { cn } from '../utils/cn';

export default function SkeletonLoader({ variant = 'card', count = 1, className }) {
  const skeletons = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className={cn('skeleton-grid', className)}>
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-card__image" />
            <div className="skeleton-card__body">
              <div className="skeleton skeleton-line skeleton-line--lg" />
              <div className="skeleton skeleton-line skeleton-line--md" />
              <div className="skeleton skeleton-line skeleton-line--sm" />
              <div className="skeleton skeleton-btn" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('skeleton-list', className)}>
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-list__item">
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-list__content">
              <div className="skeleton skeleton-line skeleton-line--md" />
              <div className="skeleton skeleton-line skeleton-line--sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className={cn('skeleton-stats', className)}>
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-stat">
            <div className="skeleton skeleton-stat__icon" />
            <div className="skeleton skeleton-line skeleton-line--lg" />
            <div className="skeleton skeleton-line skeleton-line--sm" />
          </div>
        ))}
      </div>
    );
  }

  return <div className="skeleton skeleton-line" />;
}
