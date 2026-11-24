'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  ClipboardList,
  Receipt,
  Scissors,
  Users,
  TrendingDown,
  Truck,
  Tag,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Calendar,
} from 'lucide-react';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function MobileHeader({ overdueTailoringCount = 0 }: { overdueTailoringCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-close drawer on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock background scroll and listen for Escape key when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems: NavItem[] = [
    { name: 'Daily Entries', href: '/entries', icon: ClipboardList },
    { name: 'New Entry', href: '/', icon: Receipt },
    { name: 'Tailoring', href: '/tailoring', icon: Scissors, badge: overdueTailoringCount },
    { name: 'Customer Accounts', href: '/accounts', icon: Users },
    { name: 'Shop Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Vendor Orders', href: '/vendor-orders', icon: Truck },
    { name: 'Price List', href: '/price-list', icon: Tag },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Top Bar for Mobile */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <div className="w-8 h-8 shrink-0">
            <Image
              src="/logo.png"
              alt="Arasi Iceland & Computers"
              width={32}
              height={32}
              className="w-full h-full drop-shadow-xs"
              priority
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate">
              Arasi Iceland & Computers
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {formatISTDisplay(todayIST(), 'dd MMM yyyy')}
            </p>
          </div>
        </Link>

        {/* Hamburger / Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-2 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100/80 shadow-xs flex items-center gap-1.5 touch-target transition-all shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-slate-800" />
          <span className="text-xs font-bold text-slate-700 hidden xs:inline">Menu</span>
        </button>
      </header>

      {/* Backdrop Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in Drawer from Right */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform lg:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0">
              <Image
                src="/logo.png"
                alt="Arasi Iceland & Computers"
                width={32}
                height={32}
                className="w-full h-full drop-shadow-xs"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                Arasi Iceland & Computers
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Modakurichi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors touch-target"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
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
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors touch-target',
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-sky-600' : 'text-slate-400')} />
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

        {/* Drawer Footer with Date and Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{formatISTDisplay(todayIST(), 'dd MMMM yyyy')}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors touch-target"
          >
            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
