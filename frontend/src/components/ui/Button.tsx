import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default:
    'bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]',
  primary:
    'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm',
  gradient:
    'bg-gradient-to-r from-[var(--color-primary)] to-orange-500 hover:from-[var(--color-primary-hover)] hover:to-orange-600 text-white shadow-md hover:shadow-lg',
  ghost:
    'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]',
  destructive:
    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  outline:
    'border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-400)]',
          'disabled:opacity-50 disabled:pointer-events-none',
          'active:scale-[0.97]',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
