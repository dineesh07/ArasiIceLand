'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingDown,
  Truck,
  Tag,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function MorePage() {
  const router = useRouter();

  const menuSections = [
    {
      title: 'Operations & Inventory',
      items: [
        {
          name: 'Expenses',
          description: 'Record rent, electricity, paper & stock expenses',
          href: '/expenses',
          icon: TrendingDown,
          color: 'text-amber-600 bg-amber-50',
        },
        {
          name: 'Vendor Orders',
          description: 'Arun Ice Creams ordering, WhatsApp & PDF bills',
          href: '/vendor-orders',
          icon: Truck,
          color: 'text-blue-600 bg-blue-50',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Price List',
          description: 'Manage Internet Centre, Ice Cream & Tailoring rates',
          href: '/price-list',
          icon: Tag,
          color: 'text-emerald-600 bg-emerald-50',
        },
        {
          name: 'Shop Settings',
          description: 'Shop phone, vendor phone, and data backup',
          href: '/settings',
          icon: Settings,
          color: 'text-slate-600 bg-slate-50',
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">More Options</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Expenses, Vendor Orders, Price Lists, and Shop Settings
        </p>
      </div>

      {menuSections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {section.title}
          </h2>
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors touch-target"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              );
            })}
          </Card>
        </div>
      ))}

      {/* Logout Card */}
      <Card className="p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-between p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors touch-target font-bold"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-600">
              <LogOut className="w-5 h-5" />
            </div>
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-300" />
        </button>
      </Card>
    </div>
  );
}
