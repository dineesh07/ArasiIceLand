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
  Truck,
  Store,
  Home,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
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
  expense_type: 'shop' | 'personal';
  vendor_order_no: number | null;
}

export default function ExpensesPage() {
  const today = todayIST();
  const currentMonth = today.substring(0, 7); // YYYY-MM
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExpenseType, setSelectedExpenseType] = useState<'all' | 'shop' | 'personal'>('all');

  const { data: expData, isLoading } = useExpenses({
    date: viewMode === 'daily' ? selectedDate : undefined,
    month: viewMode === 'monthly' ? selectedMonth : undefined,
    categoryId: selectedCategory,
    expenseType: selectedExpenseType,
  });
  const { data: categories = [] } = useExpenseCategories();

  const expenses = (expData?.expenses || []) as Expense[];
  const totalExpense = expData?.total ?? 0;
  const shopTotal = expData?.shopTotal ?? 0;
  const personalTotal = expData?.personalTotal ?? 0;
  const todayTotal = expData?.todayTotal ?? 0;
  const todayShopTotal = expData?.todayShopTotal ?? 0;
  const todayPersonalTotal = expData?.todayPersonalTotal ?? 0;

  const personalCategory = (categories as any[]).find((c) =>
    c.name.toLowerCase().includes('personal')
  );
  const shopCategories = (categories as any[]).filter(
    (c) => !c.name.toLowerCase().includes('personal')
  );

  // Add Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<'shop' | 'personal'>('shop');
  const [expenseDate, setExpenseDate] = useState(today);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'upi'>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = (defaultType: 'shop' | 'personal' = 'shop') => {
    setExpenseType(defaultType);
    setExpenseDate(viewMode === 'daily' && selectedDate ? selectedDate : today);
    if (defaultType === 'personal' && personalCategory) {
      setCategoryId(personalCategory.id);
    } else {
      setCategoryId(shopCategories[0]?.id || (categories[0] as any)?.id || '');
    }
    setAmount('');
    setMethod('cash');
    setNote('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleExpenseTypeSwitch = (newType: 'shop' | 'personal') => {
    setExpenseType(newType);
    if (newType === 'personal' && personalCategory) {
      setCategoryId(personalCategory.id);
    } else if (newType === 'shop') {
      setCategoryId(shopCategories[0]?.id || (categories[0] as any)?.id || '');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmt = parseInt(amount);
    if (!parsedAmt || parsedAmt <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    const catToUse =
      expenseType === 'personal' && personalCategory
        ? personalCategory.id
        : categoryId || shopCategories[0]?.id || (categories[0] as any)?.id;

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
          method,
          note,
          expense_type: expenseType,
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
      alert(
        'This expense was created automatically from a Vendor Order. To change or delete it, manage the vendor order.'
      );
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

  const shiftDate = (delta: number) => {
    const base = selectedDate ? parseISO(selectedDate) : parseISO(today);
    const next = delta > 0 ? addDays(base, delta) : subDays(base, Math.abs(delta));
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track daily shop expenses and personal & home expenses separately
          </p>
        </div>

        <Button onClick={() => openAddModal('shop')} className="flex items-center gap-2 font-bold shadow-sm">
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* Top Summary Cards: Today + Shop vs Personal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Today&apos;s Total Expenses
            </span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-1.5">{formatINR(todayTotal)}</p>
          <p className="text-xs text-slate-300 mt-1">
            Shop: {formatINR(todayShopTotal)} · Personal: {formatINR(todayPersonalTotal)}
          </p>
        </Card>

        <Card className="p-4 bg-sky-50/70 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
              Shop Expenses ({viewMode === 'daily' ? formatISTDisplay(selectedDate) : selectedMonth})
            </span>
            <Store className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
            {formatINR(shopTotal)}
          </p>
          <p className="text-xs text-sky-700 font-medium mt-1">
            Stock, electricity, rent, ink & repairs
          </p>
        </Card>

        <Card className="p-4 bg-purple-50/70 border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Personal & Home ({viewMode === 'daily' ? formatISTDisplay(selectedDate) : selectedMonth})
            </span>
            <Home className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
            {formatINR(personalTotal)}
          </p>
          <p className="text-xs text-purple-700 font-medium mt-1">
            Personal & household spending
          </p>
        </Card>
      </div>

      {/* Filters Bar: Daily / Monthly Picker + Expense Type Tabs + Category */}
      <Card className="p-4 bg-white border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Date Selector (Daily or Monthly) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start">
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>

            {viewMode === 'daily' ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  className="h-11 w-10 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0"
                  title="Previous day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 sm:w-56">
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={(val) => setSelectedDate(val || today)}
                    className="h-11 rounded-xl border-2 px-3 text-sm font-semibold text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  className="h-11 w-10 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0"
                  title="Next day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {selectedDate !== today && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(today)}
                    className="h-11 px-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 hover:bg-sky-100 shrink-0"
                  >
                    Today
                  </button>
                )}
              </div>
            ) : (
              <div className="sm:w-56">
                <CustomMonthPicker
                  value={selectedMonth}
                  onChange={(val) => setSelectedMonth(val)}
                />
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-56">
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

        {/* Expense Type Filter Tabs + Filtered Period Total */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedExpenseType('all')}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedExpenseType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Expenses
            </button>
            <button
              type="button"
              onClick={() => setSelectedExpenseType('shop')}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                selectedExpenseType === 'shop'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shop Expenses</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedExpenseType('personal')}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                selectedExpenseType === 'personal'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Personal & Home</span>
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Showing Total:</span>
            <span className="text-xl font-black text-slate-900">{formatINR(totalExpense)}</span>
          </div>
        </div>
      </Card>

      {/* Expenses List */}
      {isLoading && expenses.length === 0 ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading expenses...</span>
        </div>
      ) : expenses.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <TrendingDown className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">
            No expenses recorded for{' '}
            {viewMode === 'daily' ? formatISTDisplay(selectedDate) : selectedMonth}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Tap &quot;Add Expense&quot; above to record a shop or personal expense.
          </p>
        </Card>
      ) : (
        <>
          {/* Mobile View: Clean Responsive Cards */}
          <div className="md:hidden space-y-3">
            {expenses.map((exp) => (
              <Card key={exp.id} className="p-4 bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {exp.category_name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          exp.expense_type === 'personal'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {exp.expense_type === 'personal' ? 'Personal & Home' : 'Shop'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {formatISTDisplay(exp.expense_date)}
                    </p>
                  </div>
                  <span className="font-black text-lg text-slate-900 shrink-0">
                    {formatINR(exp.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant={exp.method === 'cash' ? 'success' : 'default'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {exp.method}
                    </Badge>
                    {exp.vendor_order_id && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                        <Truck className="w-3 h-3" />
                        <span>Vendor Order #{exp.vendor_order_no}</span>
                      </span>
                    )}
                  </div>

                  {!exp.vendor_order_id && (
                    <button
                      onClick={() => handleDeleteExpense(exp)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors ml-auto"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {exp.note && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    &quot;{exp.note}&quot;
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Desktop View: Full Data Table */}
          <Card className="hidden md:block overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Type</th>
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
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            exp.expense_type === 'personal'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {exp.expense_type === 'personal' ? (
                            <>
                              <Home className="w-3 h-3" /> Personal & Home
                            </>
                          ) : (
                            <>
                              <Store className="w-3 h-3" /> Shop
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{exp.category_name}</span>
                        {exp.vendor_order_id && (
                          <span className="inline-flex items-center gap-1 ml-2 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                            <Truck className="w-3 h-3" />
                            <span>Vendor Order #{exp.vendor_order_no}</span>
                          </span>
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
        </>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Expense"
        maxWidth="md"
      >
        {formError && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleAddExpense} className="space-y-4">
          {/* Expense Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Expense Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleExpenseTypeSwitch('shop')}
                className={`p-3 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                  expenseType === 'shop'
                    ? 'border-sky-600 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Shop Expense</span>
              </button>

              <button
                type="button"
                onClick={() => handleExpenseTypeSwitch('personal')}
                className={`p-3 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                  expenseType === 'personal'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Personal & Home</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Expense Date *</label>
            <CustomDatePicker
              required
              value={expenseDate}
              onChange={(val) => setExpenseDate(val)}
            />
          </div>

          {expenseType === 'shop' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category *</label>
              <CustomSelect
                value={categoryId}
                onChange={(val) => setCategoryId(val)}
                placeholder="Select expense category..."
                options={shopCategories.map((c: any) => ({
                  value: c.id,
                  label: c.name,
                }))}
                required
              />
            </div>
          )}

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
              placeholder={
                expenseType === 'personal'
                  ? 'e.g. Groceries, Vegetables, Home electricity'
                  : 'e.g. Xerox paper 2 reams, Electricity bill'
              }
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
