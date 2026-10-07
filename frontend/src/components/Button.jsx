import { cn } from '../utils/cn';

const VARIANTS = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  accent: 'btn--accent',
  outline: 'btn--outline',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
};

const SIZES = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
  icon: 'btn--icon',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'btn',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && 'btn--full',
        (disabled || loading) && 'btn--disabled',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon size={size === 'sm' ? 16 : 18} className="btn__icon" />
      )}
      {children}
      {!loading && RightIcon && <RightIcon size={size === 'sm' ? 16 : 18} className="btn__icon" />}
    </button>
  );
}
