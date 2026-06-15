import React from 'react';
import { cn } from '../../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-600 shadow-glow-sm hover:shadow-glow',
      secondary:
        'bg-paper-elevated text-ink-primary hover:bg-paper-hover border border-edge',
      outline:
        'bg-transparent border border-edge hover:bg-paper-elevated text-ink-secondary hover:text-ink-primary',
      ghost:
        'bg-transparent hover:bg-paper-elevated text-ink-secondary hover:text-ink-primary',
      danger:
        'bg-severity-critical/10 text-severity-critical hover:bg-severity-critical/20 border border-severity-critical/20',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 py-2 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-0',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon}
        {children && <span>{children}</span>}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
