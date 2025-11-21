import React from 'react';
import { cn } from '../../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
            secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200',
            destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
            outline: 'text-slate-950 border-slate-200',
            success: 'border-transparent bg-green-600 text-white',
            warning: 'border-transparent bg-amber-500 text-white',
            info: 'border-transparent bg-blue-500 text-white',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';
