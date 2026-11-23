'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Phone,
  Truck,
  Plus,
  FileDown,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SettingsData {
  shop_name: string;
  vendor_name: string | null;
  vendor_phone: string | null;
  shop_phone: string | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<SettingsData>({
    shop_name: 'Shop Manager',
    vendor_name: '',
    vendor_phone: '',
    shop_phone: '',
  });

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [setRes, catRes] = await Promise.all([
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/expense-categories').then((r) => r.json()),
      ]);

      if (setRes.settings) {
        setSettings({
          shop_name: setRes.settings.shop_name || 'Shop Manager',
          vendor_name: setRes.settings.vendor_name || '',
          vendor_phone: setRes.settings.vendor_phone || '',
          shop_phone: setRes.settings.shop_phone || '',
        });
      }
      setCategories(catRes.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccessMsg('Settings updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      if (res.ok) {
        setNewCatName('');
        await fetchData();
      }
    } catch {
      alert('Failed to add category');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Shop Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Store profile, distributor contacts, expense categories & full backup
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Shop Information Form */}
      <Card className="p-5 bg-white border-slate-200">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Shop & Distributor Information</CardTitle>
              <CardDescription>
                Used on vendor WhatsApp orders and PDF generation
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Shop Name</label>
              <Input
                required
                placeholder="e.g. Arasi Internet Centre & Ice Creams"
                value={settings.shop_name}
                onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Shop Phone</label>
              <Input
                placeholder="e.g. 9840012345"
                value={settings.shop_phone || ''}
                onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Vendor / Distributor Name</label>
              <Input
                placeholder="e.g. Arun Ice Creams Distributor"
                value={settings.vendor_name || ''}
                onChange={(e) => setSettings({ ...settings, vendor_name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Vendor WhatsApp / Phone</label>
              <Input
                placeholder="e.g. 9876543210"
                value={settings.vendor_phone || ''}
                onChange={(e) => setSettings({ ...settings, vendor_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={savingSettings} className="font-bold">
              {savingSettings ? 'Saving...' : 'Save Details'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Expense Categories Manager */}
      <Card className="p-5 bg-white border-slate-200">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Expense Categories</CardTitle>
              <CardDescription>
                Customize categories to classify your shop expenses
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold"
              >
                {c.name}
              </span>
            ))}
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-2 max-w-sm pt-2">
            <Input
              placeholder="New category (e.g. Tea & Snacks)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="h-10 text-xs"
            />
            <Button type="submit" size="sm" className="h-10 font-bold whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </form>
        </div>
      </Card>

      {/* Data Export / Backup */}
      <Card className="p-5 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Download Data Backup</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exports a complete CSV spreadsheet of all your bills, expenses, and customer payments
            </p>
          </div>

          <a
            href="/api/export"
            download
            className="inline-flex items-center justify-center gap-2 px-5 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors touch-target"
          >
            <FileDown className="w-5 h-5" />
            <span>Download CSV Backup</span>
          </a>
        </div>
      </Card>

      {/* Logout Card */}
      <Card className="p-5 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-red-600">Sign Out</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely sign out of your counter session
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="destructive"
            className="font-bold flex items-center gap-2 h-11"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
