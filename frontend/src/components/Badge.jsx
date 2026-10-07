import { cn } from '../utils/cn';

export default function Badge({ children, variant = 'neutral', size = 'md', className }) {
  return (
    <span className={cn('badge', `badge--${variant}`, `badge--${size}`, className)}>
      {children}
    </span>
  );
}
