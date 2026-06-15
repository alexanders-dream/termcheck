import React from 'react';
import { cn } from '../../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', dot, children, ...props }, ref) => {
    const variants = {
      default: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
      secondary: 'bg-paper-elevated text-ink-secondary border-edge',
      destructive: 'bg-severity-critical/10 text-severity-critical border-severity-critical/20',
      outline: 'bg-transparent text-ink-secondary border-edge',
      success: 'bg-green-500/10 text-green-400 border-green-500/20',
      warning: 'bg-severity-medium/10 text-severity-medium border-severity-medium/20',
      info: 'bg-severity-low/10 text-severity-low border-severity-low/20',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
          'focus:outline-none',
          variants[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-1.5 w-1.5 rounded-full',
              variant === 'destructive' && 'bg-severity-critical shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse',
              variant === 'warning' && 'bg-severity-medium shadow-[0_0_6px_rgba(251,191,36,0.6)]',
              variant === 'info' && 'bg-severity-low shadow-[0_0_6px_rgba(59,130,246,0.6)]',
              variant === 'success' && 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]',
              (variant === 'default' || variant === 'secondary') && 'bg-brand-400'
            )}
          />
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
