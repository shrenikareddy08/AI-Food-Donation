import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Logo({ size = 'md', showText = true, to = '/', variant = 'default' }) {
  const sizes = {
    sm: { icon: 20, text: 'var(--text-lg)' },
    md: { icon: 28, text: 'var(--text-xl)' },
    lg: { icon: 36, text: 'var(--text-2xl)' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <Link to={to} className={cn('logo', `logo--${variant}`)} aria-label="MealBridge home">
      <span className="logo__mark" style={{ width: s.icon + 12, height: s.icon + 12 }}>
        <UtensilsCrossed size={s.icon} strokeWidth={2.5} />
      </span>
      {showText && (
        <span className="logo__text" style={{ fontSize: s.text }}>
          Meal<span className="logo__text-accent">Bridge</span>
        </span>
      )}
    </Link>
  );
}
