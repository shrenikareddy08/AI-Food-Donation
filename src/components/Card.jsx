import { cn } from '../utils/cn';

export default function Card({ children, className, as: Component = 'div', hover = false, padding = 'md', ...props }) {
  return (
    <Component
      className={cn('card', hover && 'card--hover', `card--p-${padding}`, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
