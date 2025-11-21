import React from 'react';
import { UI_CONFIG } from '../../lib/config';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div
            className="bg-slate-50 font-sans text-slate-900"
            style={{
                width: UI_CONFIG.EXTENSION_WIDTH,
                minHeight: UI_CONFIG.EXTENSION_MIN_HEIGHT
            }}
        >
            <div className="flex flex-col h-full min-h-[600px]">
                {children}
            </div>
        </div>
    );
};
