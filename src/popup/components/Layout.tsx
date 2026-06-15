import React from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="bg-paper-bg text-ink-primary font-sans overflow-x-hidden flex flex-col relative"
      style={{
        width: 400,
        minHeight: 600,
        maxWidth: 400,
      }}
    >
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />
      
      <div className="flex flex-col h-full min-h-[600px] relative z-10">
        {children}
      </div>
    </div>
  );
};
