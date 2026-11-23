'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings } from 'lucide-react';
import { formatISTDisplay, todayIST } from '@/lib/dates';

export function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 shrink-0">
          <Image
            src="/logo.png"
            alt="Shop Manager"
            width={32}
            height={32}
            className="w-full h-full drop-shadow-xs"
            priority
          />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Shop Manager</h1>
          <p className="text-[11px] text-slate-500 font-medium">
            {formatISTDisplay(todayIST())}
          </p>
        </div>
      </div>
      <Link
        href="/settings"
        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg touch-target flex items-center justify-center"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </Link>
    </header>
  );
}

