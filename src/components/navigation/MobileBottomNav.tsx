'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, PlusCircle, Scissors, Users, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav({ overdueTailoringCount = 0 }: { overdueTailoringCount?: number }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Entries', href: '/entries', icon: ClipboardList },
    { name: 'New Entry', href: '/', icon: PlusCircle },
    { name: 'Tailoring', href: '/tailoring', icon: Scissors, badge: overdueTailoringCount },
    { name: 'Accounts', href: '/accounts', icon: Users },
    { name: 'More', href: '/more', icon: MoreHorizontal },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-1 shadow-lg safe-bottom">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : tab.href === '/more'
                ? pathname.startsWith('/more') ||
                pathname.startsWith('/expenses') ||
                pathname.startsWith('/vendor-orders') ||
                pathname.startsWith('/price-list') ||
                pathname.startsWith('/settings')
                : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors relative touch-target',
                isActive
                  ? 'text-sky-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-6 h-6', isActive ? 'text-sky-600 stroke-[2.5]' : 'text-slate-500')} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

