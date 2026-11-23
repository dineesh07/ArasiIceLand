'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Receipt,
  Scissors,
  Users,
  BarChart3,
  TrendingDown,
  Truck,
  Tag,
  Settings as SettingsIcon,
  LogOut,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function DesktopSidebar({ overdueTailoringCount = 0 }: { overdueTailoringCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    { name: 'New Entry', href: '/', icon: Receipt },
    { name: 'Tailoring', href: '/tailoring', icon: Scissors, badge: overdueTailoringCount },
    { name: 'Accounts', href: '/accounts', icon: Users },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Vendor Orders', href: '/vendor-orders', icon: Truck },
    { name: 'Price List', href: '/price-list', icon: Tag },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-50 bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-18 border-b border-slate-100 py-4">
        <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-900 leading-tight">Shop Manager</h1>
          <p className="text-xs text-slate-500 font-medium">Counter Point-of-Sale</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-semibold transition-colors touch-target',
                isActive
                  ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-5 h-5', isActive ? 'text-sky-600' : 'text-slate-500')} />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3.5 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 transition-colors touch-target"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
