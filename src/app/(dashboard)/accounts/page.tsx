'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { useCustomers } from '@/lib/api-hooks';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { Modal } from '@/components/ui/modal';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  is_account: boolean;
  active: boolean;
  balance: number;
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useCustomers(false);

  const customers = ((data?.customers || []) as Customer[]);
  const totalOutstanding = data?.totalOutstanding ?? 0;

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAccount, setIsAccount] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone ? phone.trim() : null,
          is_account: isAccount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create customer');
        setSaving(false);
        return;
      }

      setModalOpen(false);
      setName('');
      setPhone('');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch {
      setError('Error creating customer');
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Customer Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Credit customers, pending ledger balances, and payment records
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2 font-bold shadow-sm">
          <Plus className="w-5 h-5" />
          <span>Add Account Customer</span>
        </Button>
      </div>

      {/* Outstanding Total Card */}
      <Card className="p-5 bg-amber-50 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Total Outstanding Balance (All Accounts)
            </p>
            <p className="text-3xl font-black text-amber-950 mt-1">
              {formatINR(totalOutstanding)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-400" />
        <Input
          placeholder="Search by customer name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 bg-white"
        />
      </div>

      {/* Customers List */}
      {isLoading && customers.length === 0 ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading customer accounts...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No customers found</p>
          <p className="text-xs text-slate-400">Add credit customers to track their ledger.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cust) => (
            <Link key={cust.id} href={`/accounts/${cust.id}`} className="block">
              <Card className="p-4 hover:border-sky-400 hover:shadow-md transition-all bg-white cursor-pointer h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{cust.name}</h3>
                    {cust.phone ? (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.phone}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-0.5">No phone number</p>
                    )}
                  </div>

                  <Badge variant={cust.is_account ? 'default' : 'secondary'} className="text-[10px]">
                    {cust.is_account ? 'Credit Account' : 'Standard'}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Pending Balance</span>
                    <span
                      className={`text-xl font-black ${
                        cust.balance > 0 ? 'text-red-600' : 'text-slate-700'
                      }`}
                    >
                      {formatINR(cust.balance)}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-sky-600 flex items-center gap-1">
                    View Ledger <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Customer"
        maxWidth="md"
      >
        {error && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Customer Name *</label>
            <Input
              required
              placeholder="e.g. Senthil Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Phone Number (Optional)</label>
            <Input
              placeholder="e.g. 9840012345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <CustomCheckbox
              id="account-check"
              checked={isAccount}
              onChange={(checked) => setIsAccount(checked)}
              label="Enable Credit Account"
              description="Allows customer to defer payments with 'Add to Account' at checkout"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="font-bold">
              {saving ? 'Saving...' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
