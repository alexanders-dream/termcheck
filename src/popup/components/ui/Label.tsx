import React from 'react';
import { cn } from '../../../lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-ink-secondary mb-1.5 block',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-severity-critical ml-0.5">*</span>}
    </label>
  )
);
Label.displayName = 'Label';
