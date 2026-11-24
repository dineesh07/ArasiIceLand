'use client';

import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileHeader } from './MobileHeader';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <MobileHeader />
        <main className="flex-1 pb-8 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
