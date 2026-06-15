import React from 'react';
import { cn } from '../../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2.5 text-sm bg-paper-surface border rounded-lg',
          'text-ink-primary placeholder:text-ink-muted',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-severity-critical focus:border-severity-critical focus:ring-severity-critical/20' : 'border-edge hover:border-edge-light',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-severity-critical font-medium">{error}</p>
      )}
    </div>
  )
);
Input.displayName = 'Input';
