'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  TrendingDown,
  Plus,
  Wallet,
  Smartphone,
  Trash2,
  RefreshCw,
  X,
  Truck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { useExpenses, useExpenseCategories } from '@/lib/api-hooks';
import { CustomSelect } from '@/components/ui/custom-select';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { CustomMonthPicker } from '@/components/ui/custom-month-picker';
import { Modal } from '@/components/ui/modal';

interface Expense {
  id: string;
  expense_date: string;
  category_id: string;
  amount: number;
  method: 'cash' | 'upi';
  note: string | null;
  vendor_order_id: string | null;
  category_name: string;
  vendor_order_no: number | null;
}

export default function ExpensesPage() {
  const today = todayIST();
  const currentMonth = today.substring(0, 7); // YYYY-MM
  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: expData, isLoading } = useExpenses(selectedMonth, selectedCategory);
  const { data: categories = [] } = useExpenseCategories();

  const expenses = ((expData?.expenses || []) as Expense[]);
  const totalExpense = expData?.total ?? 0;

  // Add Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState(today);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'upi'>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setExpenseDate(today);
    setCategoryId((categories[0] as any)?.id || '');
    setAmount('');
    setMethod('cash');
    setNote('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmt = parseInt(amount);
    if (!parsedAmt || parsedAmt <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    const catToUse = categoryId || (categories[0] as any)?.id;
    if (!catToUse) {
      setFormError('Please select a category');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_date: expenseDate,
          category_id: catToUse,
          amount: parsedAmt,
          method: method,
          note: note,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Failed to add expense');
        setSaving(false);
        return;
      }

      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    } catch {
      setFormError('Error recording expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (exp: Expense) => {
    if (exp.vendor_order_id) {
      alert('This expense was created automatically from a Vendor Order. To change or delete it, manage the vendor order.');
      return;
    }

    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses?id=${exp.id}`, { method: 'DELETE' });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      }
    } catch {
      alert('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Rent, electricity, paper & ink, repairs, and vendor stock payments
          </p>
        </div>

        <Button onClick={openAddModal} className="flex items-center gap-2 font-bold shadow-sm">
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* Month Total Banner */}
      <Card className="p-5 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Total Expenses for Selected Period
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {formatINR(totalExpense)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Month:</label>
              <CustomMonthPicker
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
              />
            </div>

            <div className="w-56">
              <label className="text-xs font-bold text-slate-500 block mb-1">Category:</label>
              <CustomSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                className="h-11 rounded-xl border-2 px-3 font-semibold text-sm bg-slate-50"
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...(categories as any[]).map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      {isLoading && expenses.length === 0 ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading expenses...</span>
        </div>
      ) : expenses.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <TrendingDown className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No expenses recorded for this month</p>
          <p className="text-xs text-slate-400">Tap "Add Expense" above to record an expense.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Note</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-semibold text-slate-900 whitespace-nowrap">
                      {formatISTDisplay(exp.expense_date)}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800">{exp.category_name}</span>
                      {exp.vendor_order_id && (
                        <Badge variant="default" className="ml-2 text-[10px] bg-blue-100 text-blue-800 gap-1">
                          <Truck className="w-3 h-3" />
                          <span>Vendor Order #{exp.vendor_order_no}</span>
                        </Badge>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={exp.method === 'cash' ? 'success' : 'default'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {exp.method}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500 text-xs max-w-xs truncate">
                      {exp.note || '—'}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 text-base">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {!exp.vendor_order_id && (
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Shop Expense"
        maxWidth="md"
      >
        {formError && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Expense Date *</label>
            <CustomDatePicker
              required
              value={expenseDate}
              onChange={(val) => setExpenseDate(val)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Category *</label>
            <CustomSelect
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              placeholder="Select expense category..."
              options={(categories as any[]).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Amount (₹) *</label>
            <Input
              type="number"
              min="1"
              required
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Payment Method *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 touch-target ${
                  method === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 touch-target ${
                  method === 'upi'
                    ? 'border-sky-600 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI / GPay</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Note / Reason (Optional)</label>
            <Input
              placeholder="e.g. Xerox paper 2 reams, Electricity bill"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="font-bold">
              {saving ? 'Saving...' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
