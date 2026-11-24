'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Receipt,
  Printer,
  Edit2,
  Trash2,
  IndianRupee,
  Smartphone,
  Banknote,
  CreditCard,
  X,
  Store,
  Clock,
  Phone,
  User,
  CheckCircle2,
} from 'lucide-react';
import { format, parseISO, addDays, subDays, isToday } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { Modal } from '@/components/ui/modal';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, formatISTDateTime, todayIST } from '@/lib/dates';
import { useBills } from '@/lib/api-hooks';

interface BillItem {
  id?: string;
  service_id: string;
  category_id: string;
  service_name: string;
  pricing_type: string;
  quantity: number;
  unit_rate: number;
  min_charge: number | null;
  amount: number;
}

interface BillEntry {
  id: string;
  bill_date: string;
  token_no: number | null;
  customer_id: string | null;
  customer_name: string | null;
  phone: string | null;
  payment_method: 'cash' | 'upi' | 'account';
  total: number;
  created_at: string;
  account_customer_name?: string | null;
  items: BillItem[];
}

export default function DailyEntriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = todayIST();

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'upi' | 'account'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [receiptBill, setReceiptBill] = useState<BillEntry | null>(null);
  const [billToDelete, setBillToDelete] = useState<BillEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch bills for selected date
  const { data: billsData, isLoading, isFetching, refetch } = useBills(selectedDate);

  const bills = useMemo(() => {
    return ((billsData?.bills || []) as BillEntry[]);
  }, [billsData]);

  const summary = useMemo(() => {
    return billsData?.summary || {
      cash_total: 0,
      upi_total: 0,
      account_total: 0,
      grand_total: 0,
      count: 0,
    };
  }, [billsData]);

  // Date Navigation
  const handlePrevDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(subDays(d, 1), 'yyyy-MM-dd'));
    } catch {
      setSelectedDate(today);
    }
  };

  const handleNextDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(addDays(d, 1), 'yyyy-MM-dd'));
    } catch {
      setSelectedDate(today);
    }
  };

  const handleJumpToToday = () => {
    setSelectedDate(today);
  };

  // Filtered and sorted bills
  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        // Payment filter
        if (paymentFilter !== 'all' && b.payment_method !== paymentFilter) {
          return false;
        }

        // Search filter
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase().trim();
        const matchesName = (b.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (b.phone || '').includes(q);
        const matchesToken = b.token_no ? String(b.token_no).includes(q) : false;
        const matchesItem = (b.items || []).some((it) =>
          it.service_name.toLowerCase().includes(q)
        );

        return matchesName || matchesPhone || matchesToken || matchesItem;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [bills, paymentFilter, searchTerm, sortOrder]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: bills.length,
      cash: bills.filter((b) => b.payment_method === 'cash').length,
      upi: bills.filter((b) => b.payment_method === 'upi').length,
      account: bills.filter((b) => b.payment_method === 'account').length,
    };
  }, [bills]);

  // Delete Bill handler
  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/bills?id=${billToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete bill');
      }

      setToastMessage(`Bill #${billToDelete.token_no || ''} deleted`);
      setTimeout(() => setToastMessage(null), 3000);
      setBillToDelete(null);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['token-preview'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err: any) {
      alert(err.message || 'Error deleting bill');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const isCurrentToday = selectedDate === today;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Date Navigation Toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
              Sales Records
            </span>
            {isCurrentToday && (
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Live Today
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Daily Entries</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {formatISTDisplay(selectedDate, 'EEEE, dd MMMM yyyy')}
          </p>
        </div>

        {/* Date Selector & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevDay}
              className="h-9 px-2.5 text-slate-700 hover:text-slate-900"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1 text-xs font-semibold">Prev</span>
            </Button>

            <div className="w-40 sm:w-48 px-1">
              <CustomDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                showShortcuts={false}
                className="w-full text-xs"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextDay}
              className="h-9 px-2.5 text-slate-700 hover:text-slate-900"
              title="Next Day"
            >
              <span className="hidden sm:inline mr-1 text-xs font-semibold">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {!isCurrentToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleJumpToToday}
              className="h-10 text-xs font-bold text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100"
            >
              Today
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 px-3 text-slate-600 hover:text-slate-900"
            title="Refresh entries"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-sky-600' : ''}`} />
          </Button>

          <Link href="/">
            <Button className="h-10 bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Metrics / Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Grand Total */}
        <Card className="p-4 bg-white border border-sky-200 shadow-xs col-span-2 sm:col-span-1 relative overflow-hidden bg-gradient-to-br from-sky-50/70 via-white to-white">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Total Sales</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-slate-900 tracking-tight">
            {formatINR(summary.grand_total)}
          </p>
          <p className="text-xs text-sky-700 font-medium mt-1">
            {bills.length} {bills.length === 1 ? 'bill' : 'bills'} on this day
          </p>
        </Card>

        {/* Total Bills */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Bills</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-slate-900 tracking-tight">
            {bills.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {bills.length > 0 ? `Token #${Math.min(...bills.map(b => b.token_no || 1))} - #${Math.max(...bills.map(b => b.token_no || 1))}` : 'No tokens'}
          </p>
        </Card>

        {/* Cash Total */}
        <Card className="p-4 bg-white border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Cash Collected</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-900 tracking-tight">
            {formatINR(summary.cash_total)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {counts.cash} cash {counts.cash === 1 ? 'bill' : 'bills'}
          </p>
        </Card>

        {/* UPI Total */}
        <Card className="p-4 bg-white border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-xs font-semibold uppercase tracking-wider">UPI Collected</span>
            <Smartphone className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black mt-2 text-sky-900 tracking-tight">
            {formatINR(summary.upi_total)}
          </p>
          <p className="text-xs text-sky-600 font-medium mt-1">
            {counts.upi} UPI {counts.upi === 1 ? 'bill' : 'bills'}
          </p>
        </Card>

        {/* Account / Credit Total */}
        <Card className="p-4 bg-white border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-semibold uppercase tracking-wider">Account / Credit</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black mt-2 text-amber-950 tracking-tight">
            {formatINR(summary.account_total)}
          </p>
          <p className="text-xs text-amber-700 font-medium mt-1">
            {counts.account} credit {counts.account === 1 ? 'bill' : 'bills'}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, phone, token #, item..."
            className="pl-10 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'all'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setPaymentFilter('cash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'cash'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Cash ({counts.cash})
          </button>
          <button
            onClick={() => setPaymentFilter('upi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'upi'
                ? 'bg-sky-600 text-white'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            UPI ({counts.upi})
          </button>
          <button
            onClick={() => setPaymentFilter('account')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'account'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Account ({counts.account})
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="h-8 text-xs font-semibold text-slate-500 ml-auto"
          >
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
      </div>

      {/* Bills Cards List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 animate-pulse bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-6 bg-slate-200 rounded" />
                <div className="w-20 h-6 bg-slate-200 rounded" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredBills.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchTerm || paymentFilter !== 'all'
              ? 'No bills match your search criteria'
              : `No entries recorded on ${formatISTDisplay(selectedDate, 'dd MMMM yyyy')}`}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || paymentFilter !== 'all'
              ? 'Try adjusting your search terms or filter selection.'
              : 'There are no counter sales or bills registered for this day.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {searchTerm || paymentFilter !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setPaymentFilter('all');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Link href="/">
                <Button className="bg-sky-600 hover:bg-sky-700 text-white font-bold gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Bill in New Entry</span>
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map((bill) => {
            const displayName =
              bill.customer_name ||
              (bill.token_no ? `Token #${bill.token_no}` : 'Walk-in Customer');

            return (
              <Card
                key={bill.id}
                className="p-5 hover:shadow-md transition-all bg-white border-slate-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {bill.token_no ? (
                        <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-800 font-black text-lg flex items-center justify-center shrink-0 border border-sky-200">
                          #{bill.token_no}
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-800 font-bold text-base flex items-center justify-center shrink-0">
                          {bill.customer_name?.charAt(0).toUpperCase() || 'W'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                          {displayName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatISTDateTime(bill.created_at).split(',')[1]?.trim() || ''}
                          </span>
                          {bill.phone && (
                            <span className="flex items-center gap-1 font-medium">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {bill.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-slate-900 tracking-tight">
                        {formatINR(bill.total)}
                      </p>
                      <Badge
                        variant={
                          bill.payment_method === 'cash'
                            ? 'success'
                            : bill.payment_method === 'upi'
                            ? 'default'
                            : 'warning'
                        }
                        className="text-[10px] uppercase font-bold mt-0.5"
                      >
                        {bill.payment_method}
                      </Badge>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="space-y-1.5 text-xs text-slate-700">
                      {(bill.items || []).map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">
                            {it.service_name} <span className="text-slate-400 font-normal">×{it.quantity}</span>
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatINR(it.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReceiptBill(bill)}
                    className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Receipt</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/?edit=${bill.id}`)}
                      className="h-8 text-xs font-bold gap-1 text-sky-700 hover:text-sky-800 hover:bg-sky-50 border-sky-200"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBillToDelete(bill)}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                      title="Delete bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {billToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setBillToDelete(null)}
          title="Delete Bill Record"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete bill{' '}
              <strong>
                {billToDelete.token_no ? `Token #${billToDelete.token_no}` : billToDelete.customer_name || 'Walk-in'}
              </strong>{' '}
              for <strong>{formatINR(billToDelete.total)}</strong>?
            </p>
            <p className="text-xs text-slate-400">
              This action will remove the bill from the day's total collected sales.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBillToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt Modal */}
      {receiptBill && (
        <Modal
          isOpen={true}
          onClose={() => setReceiptBill(null)}
          title="Receipt Preview"
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Printable Receipt Paper */}
            <div
              id="printable-receipt"
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 text-slate-900 font-sans"
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  Arasi Iceland & Computers
                </h2>
                <p className="text-xs text-slate-500 font-medium">Ice Cream Parlour & Counter POS</p>
                <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-600">
                  <span>{formatISTDisplay(receiptBill.bill_date)}</span>
                  <span>•</span>
                  <span>{formatISTDateTime(receiptBill.created_at).split(',')[1]?.trim()}</span>
                </div>
              </div>

              {/* Token & Customer Info */}
              <div className="flex items-center justify-between text-xs py-1">
                <div>
                  <span className="text-slate-400">Customer: </span>
                  <span className="font-bold text-slate-800">
                    {receiptBill.customer_name || 'Walk-in Customer'}
                  </span>
                  {receiptBill.phone && (
                    <span className="text-slate-500 block text-[11px]">{receiptBill.phone}</span>
                  )}
                </div>
                {receiptBill.token_no && (
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Token</span>
                    <span className="text-lg font-black text-sky-700">#{receiptBill.token_no}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-300 py-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-1">
                      <th className="text-left font-bold pb-1">Item</th>
                      <th className="text-center font-bold pb-1">Qty</th>
                      <th className="text-right font-bold pb-1">Rate</th>
                      <th className="text-right font-bold pb-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(receiptBill.items || []).map((it, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1.5 font-medium text-slate-800">{it.service_name}</td>
                        <td className="py-1.5 text-center text-slate-600">{it.quantity}</td>
                        <td className="py-1.5 text-right text-slate-600">{formatINR(it.unit_rate)}</td>
                        <td className="py-1.5 text-right font-bold text-slate-900">{formatINR(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Payment */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-700">Grand Total:</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatINR(receiptBill.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Payment Method:</span>
                  <span className="font-bold uppercase text-slate-800 tracking-wider">
                    {receiptBill.payment_method}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-400">
                <p className="font-medium">Thank you for visiting Arasi Iceland & Computers!</p>
                <p>Have a wonderful day!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReceiptBill(null)}
              >
                Close
              </Button>
              <Button
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold gap-2"
                size="sm"
                onClick={handlePrintReceipt}
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
