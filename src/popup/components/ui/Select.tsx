import React from 'react';
import { cn } from '../../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="w-full relative">
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2.5 pr-10 text-sm bg-paper-surface border rounded-lg appearance-none',
          'text-ink-primary',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-severity-critical focus:border-severity-critical' : 'border-edge hover:border-edge-light',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-ink-muted" />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-severity-critical font-medium">{error}</p>
      )}
    </div>
  )
);
Select.displayName = 'Select';
