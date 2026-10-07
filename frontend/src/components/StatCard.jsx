import { cn } from '../utils/cn';

export default function StatCard({ icon: Icon, label, value, sublabel, color = 'primary', trend, className }) {
  return (
    <div className={cn('stat-card', `stat-card--${color}`, className)}>
      <div className="stat-card__top">
        <span className="stat-card__icon">
          {Icon && <Icon size={22} />}
        </span>
        {trend != null && (
          <span className={cn('stat-card__trend', trend >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {sublabel && <div className="stat-card__sublabel">{sublabel}</div>}
    </div>
  );
}
