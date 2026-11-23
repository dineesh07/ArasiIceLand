'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Wallet,
  Smartphone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Edit2,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { calculateAmount } from '@/lib/pricing';
import { PricingType, formatServiceName } from '@/types';
import {
  useServices,
  useCategories,
  useCustomers,
  useBills,
  useTokenPreview,
  useSubcategories,
} from '@/lib/api-hooks';

interface Service {
  id: string;
  category_id: string;
  category_name: string;
  subcategory_id?: string | null;
  subcategory_name?: string | null;
  size_label?: string | null;
  name: string;
  active: boolean;
  pricing_type: PricingType;
  unit_label: string | null;
  rate: number;
  min_charge: number | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  is_account: boolean;
  balance: number;
}

interface LineItem {
  service_id: string;
  category_id: string;
  service_name: string;
  pricing_type: PricingType;
  unit_rate: number;
  min_charge: number | null;
  quantity: number;
  amount: number;
  isMinApplied: boolean;
}

interface BillItemSummary {
  service_name: string;
  quantity: number;
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
  items: BillItemSummary[];
}

export default function NewEntryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = todayIST();

  // Instant Cached Data Hooks
  const { data: allServices = [], isLoading: servicesLoading } = useServices();
  const { data: categories = [] } = useCategories();
  const { data: customerData, isLoading: customersLoading } = useCustomers();
  const { data: billsData, refetch: refetchBills } = useBills(today);
  const { data: tokenData } = useTokenPreview();

  const services = ((allServices || []) as Service[]).filter((s) => s && s.active);
  const customers = ((customerData?.customers || []) as Customer[]);
  const todayBills = ((billsData?.bills || []) as BillEntry[]);
  const nextToken = tokenData?.nextToken ?? 1;
  const totalCollected = tokenData?.totalCollected ?? 0;

  // Active category filter on counter
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');

  const iceCreamCategory = (categories as any[]).find((c) => c.name.toLowerCase().includes('ice'));
  const isIceCreamActive = activeCategory === iceCreamCategory?.id;
  const { data: subcategories = [] } = useSubcategories(iceCreamCategory?.id);
  const iceCreamServices = services.filter((s) => s.category_id === iceCreamCategory?.id);

  const currentSubcategory = (subcategories as any[]).find((s) => s.id === selectedSubcategoryId);
  const currentSubcategoryName = selectedSubcategoryId === 'all'
    ? 'All Ice Creams'
    : currentSubcategory?.name || 'Ice Cream';

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState<number | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Cart Line Items
  const [cartItems, setCartItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editing existing bill
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  const customerInputRef = useRef<HTMLInputElement>(null);

  // Customer Name Autocomplete
  const handleNameChange = (val: string) => {
    setCustomerName(val);
    setSelectedCustomerId(null);
    setSelectedCustomerBalance(null);

    if (val.trim().length > 0) {
      const matches = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(val.toLowerCase()) ||
          (c.phone && c.phone.includes(val))
      );
      setCustomerSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setPhone(cust.phone || '');
    setSelectedCustomerId(cust.id);
    setSelectedCustomerBalance(cust.balance);
    setShowSuggestions(false);
  };

  // Add service to line items (Instant 0ms click response)
  const addServiceToCart = (srv: Service) => {
    if (srv.category_name.toLowerCase().includes('tailor')) {
      router.push('/tailoring');
      return;
    }

    const displayName = formatServiceName(srv.name, srv.size_label);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.service_id === srv.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        const newAmt = calculateAmount({
          pricing_type: srv.pricing_type,
          rate: srv.rate,
          min_charge: srv.min_charge,
          quantity: newQty,
        });
        const isMinApplied =
          srv.pricing_type === 'PER_UNIT_MIN' &&
          srv.min_charge !== null &&
          srv.rate * newQty < srv.min_charge;

        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          amount: newAmt,
          isMinApplied,
        };
        return updated;
      } else {
        const amt = calculateAmount({
          pricing_type: srv.pricing_type,
          rate: srv.rate,
          min_charge: srv.min_charge,
          quantity: 1,
        });
        const isMinApplied =
          srv.pricing_type === 'PER_UNIT_MIN' &&
          srv.min_charge !== null &&
          srv.rate * 1 < srv.min_charge;

        return [
          ...prev,
          {
            service_id: srv.id,
            category_id: srv.category_id,
            service_name: displayName,
            pricing_type: srv.pricing_type,
            unit_rate: srv.rate,
            min_charge: srv.min_charge,
            quantity: 1,
            amount: amt,
            isMinApplied,
          },
        ];
      }
    });
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newAmt = calculateAmount({
        pricing_type: item.pricing_type,
        rate: item.unit_rate,
        min_charge: item.min_charge,
        quantity: newQty,
      });
      const isMinApplied =
        item.pricing_type === 'PER_UNIT_MIN' &&
        item.min_charge !== null &&
        item.unit_rate * newQty < item.min_charge;

      updated[index] = {
        ...item,
        quantity: newQty,
        amount: newAmt,
        isMinApplied,
      };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const billTotal = cartItems.reduce((sum, item) => sum + item.amount, 0);

  const isAccountCustomer =
    selectedCustomerId !== null &&
    customers.find((c) => c.id === selectedCustomerId)?.is_account === true;

  const handleSaveBill = async (payment_method: 'cash' | 'upi' | 'account') => {
    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one service item to the bill.');
      return;
    }

    if (payment_method === 'account' && !isAccountCustomer) {
      setErrorMessage('Add to Account is only available for registered Credit Account customers.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        bill_date: today,
        customer_id: selectedCustomerId,
        customer_name: customerName,
        phone: phone,
        payment_method: payment_method,
        items: cartItems.map((i) => ({
          service_id: i.service_id,
          category_id: i.category_id,
          service_name: i.service_name,
          pricing_type: i.pricing_type,
          quantity: i.quantity,
          unit_rate: i.unit_rate,
          min_charge: i.min_charge,
        })),
      };

      let res;
      if (editingBillId) {
        res = await fetch('/api/bills', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingBillId }),
        });
      } else {
        res = await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save bill');
        setSaving(false);
        return;
      }

      const token = data.bill?.token_no;
      const successText = token
        ? `Saved! Token #${token} (${formatINR(data.bill.total)})`
        : `Saved bill for ${data.bill?.customer_name || 'Customer'} (${formatINR(data.bill.total)})`;

      setToastMessage(successText);
      setTimeout(() => setToastMessage(null), 4000);

      // Reset form
      setCartItems([]);
      setCustomerName('');
      setPhone('');
      setSelectedCustomerId(null);
      setSelectedCustomerBalance(null);
      setEditingBillId(null);

      // Invalidate caches instantly
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['token-preview'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (e: any) {
      setErrorMessage(e.message || 'Error saving bill');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBill = (bill: BillEntry) => {
    setEditingBillId(bill.id);
    setCustomerName(bill.customer_name || '');
    setPhone(bill.phone || '');
    setSelectedCustomerId(bill.customer_id);

    const mapped = (bill.items || []).map((bi: any) => {
      const srv = services.find((s) => s.name === bi.service_name);
      return {
        service_id: bi.service_id || srv?.id || '',
        category_id: bi.category_id || srv?.category_id || '',
        service_name: bi.service_name,
        pricing_type: bi.pricing_type as PricingType,
        unit_rate: bi.unit_rate,
        min_charge: bi.min_charge,
        quantity: bi.quantity,
        amount: bi.amount,
        isMinApplied:
          bi.pricing_type === 'PER_UNIT_MIN' &&
          bi.min_charge !== null &&
          bi.unit_rate * bi.quantity < bi.min_charge,
      };
    });

    setCartItems(mapped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill? It will be removed from totals.')) return;

    try {
      const res = await fetch(`/api/bills?id=${billId}`, { method: 'DELETE' });
      if (res.ok) {
        setToastMessage('Bill deleted successfully');
        setTimeout(() => setToastMessage(null), 3000);
        queryClient.invalidateQueries({ queryKey: ['bills'] });
        queryClient.invalidateQueries({ queryKey: ['token-preview'] });
      }
    } catch {
      alert('Failed to delete bill');
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesCategory =
      activeCategory === 'all' || s.category_id === activeCategory;

    const matchesSubcategory =
      !isIceCreamActive ||
      selectedSubcategoryId === null ||
      selectedSubcategoryId === 'all' ||
      s.subcategory_id === selectedSubcategoryId;

    const searchTerm = serviceSearch.toLowerCase().trim();
    const fullName = formatServiceName(s.name, s.size_label).toLowerCase();
    const matchesSearch =
      !searchTerm ||
      fullName.includes(searchTerm) ||
      (s.size_label && s.size_label.toLowerCase().includes(searchTerm)) ||
      (s.subcategory_name && s.subcategory_name.toLowerCase().includes(searchTerm));

    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
            Counter Point of Sale
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">New Entry</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Today: <strong>{formatISTDisplay(today, 'EEEE, dd MMMM yyyy')}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400 font-semibold">Today's Total Collected</p>
            <p className="text-2xl font-black text-slate-900">
              {formatINR(totalCollected)}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden sm:block" />
          <div className="text-left sm:text-right bg-sky-50 px-3.5 py-2 rounded-xl border border-sky-100">
            <p className="text-[11px] text-sky-700 font-bold uppercase tracking-wide">Next Token Preview</p>
            <p className="text-2xl font-black text-sky-700">
              #{nextToken}
            </p>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center gap-3 text-emerald-900 font-bold text-base shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-3 text-red-900 font-semibold text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customer Info + Service Picker */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Customer Name (Optional)
                </label>
                <Input
                  ref={customerInputRef}
                  placeholder="e.g. Ramesh, Priya (or leave empty)"
                  value={customerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => customerName && setShowSuggestions(true)}
                  className="bg-slate-50 font-medium"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {customerSuggestions.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => selectCustomer(cust)}
                        className="w-full text-left p-3 hover:bg-sky-50 flex items-center justify-between transition-colors touch-target"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {cust.name}
                            {cust.is_account && (
                              <Badge variant="default" className="text-[10px]">
                                Account
                              </Badge>
                            )}
                          </div>
                          {cust.phone && (
                            <div className="text-xs text-slate-400">{cust.phone}</div>
                          )}
                        </div>
                        {cust.is_account && (
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">Balance</span>
                            <span className="text-xs font-bold text-red-600">
                              {formatINR(cust.balance)}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Phone (Optional)
                </label>
                <Input
                  placeholder="e.g. 9840012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-50 font-medium"
                />
              </div>
            </div>

            {selectedCustomerId && selectedCustomerBalance !== null && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  Account Customer Balance:
                </span>
                <span className="text-sm font-black text-amber-900">
                  {formatINR(selectedCustomerBalance)}
                </span>
              </div>
            )}
          </Card>

          {/* Service Picker: Tabs & Search */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedSubcategoryId(null);
                  setServiceSearch('');
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors touch-target ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Services
              </button>
              {(categories as any[]).map((c) => {
                const isTailoring = c.name.toLowerCase().includes('tailor');
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isTailoring) {
                        router.push('/tailoring');
                      } else {
                        setActiveCategory(c.id);
                        setSelectedSubcategoryId(null);
                        setServiceSearch('');
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors touch-target flex items-center gap-1.5 ${
                      isTailoring
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                        : activeCategory === c.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {isTailoring && <Scissors className="w-4 h-4" />}
                    <span>{c.name}</span>
                    {isTailoring && <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 rounded-md">Orders</span>}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-400" />
              <Input
                placeholder="Search printout, ice cream, service..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="pl-10 h-12 bg-white"
              />
            </div>
          </div>

          {/* Service Tiles Grid or Subcategory Cards for Ice Cream */}
          {servicesLoading ? (
            <div className="text-center py-12 text-slate-400">Loading services...</div>
          ) : isIceCreamActive && !serviceSearch.trim() && selectedSubcategoryId === null ? (
            /* Subcategory Cards Grid (Only for Ice Cream) */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Arun Ice Creams Group
                </span>
                <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                  {iceCreamServices.length} items total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* All Ice Creams Card */}
                <button
                  type="button"
                  onClick={() => setSelectedSubcategoryId('all')}
                  className="p-3.5 bg-white border-2 border-slate-200 hover:border-rose-400 hover:shadow-md rounded-2xl text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between min-h-[96px] touch-target group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                        Full Menu
                      </span>
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                        {iceCreamServices.length}
                      </span>
                    </div>
                    <p className="font-extrabold text-slate-900 text-sm leading-tight mt-1 group-hover:text-rose-600 transition-colors">
                      All Ice Creams
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-500">
                      from {formatINR(15)}
                    </span>
                    <span className="text-slate-400 font-bold group-hover:text-rose-600 flex items-center gap-0.5 transition-colors">
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>

                {/* Subcategory Cards */}
                {(subcategories as any[]).map((sub) => {
                  const subItems = iceCreamServices.filter((s) => s.subcategory_id === sub.id);
                  const rates = subItems.map((i) => i.rate);
                  const minRate = rates.length > 0 ? Math.min(...rates) : 0;
                  const maxRate = rates.length > 0 ? Math.max(...rates) : 0;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubcategoryId(sub.id)}
                      className="p-3.5 bg-white border-2 border-slate-200 hover:border-rose-400 hover:shadow-md rounded-2xl text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between min-h-[96px] touch-target group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                            Group
                          </span>
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                            {subItems.length}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm leading-tight mt-1 group-hover:text-rose-600 transition-colors">
                          {sub.name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-xs">
                        <span className="font-semibold text-slate-500">
                          {rates.length > 0
                            ? minRate === maxRate
                              ? formatINR(minRate)
                              : `${formatINR(minRate)} - ${formatINR(maxRate)}`
                            : '0 items'}
                        </span>
                        <span className="text-slate-400 font-bold group-hover:text-rose-600 flex items-center gap-0.5 transition-colors">
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Product Tiles Grid */
            <div className="space-y-3">
              {/* Back button and group banner when viewing inside an ice cream group */}
              {isIceCreamActive && selectedSubcategoryId !== null && !serviceSearch.trim() && (
                <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200 rounded-2xl p-2.5 px-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategoryId(null)}
                      className="p-1.5 px-2.5 bg-white hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 shadow-xs transition-colors flex items-center gap-1.5 text-xs font-bold touch-target"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Groups</span>
                    </button>
                    <div className="h-4 w-px bg-rose-200" />
                    <span className="text-sm font-extrabold text-rose-950">
                      {currentSubcategoryName}
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                      {filteredServices.length} items
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSubcategoryId(null)}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900"
                  >
                    Change Group
                  </button>
                </div>
              )}

              {filteredServices.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
                  No items found matching your criteria.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredServices.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => addServiceToCart(srv)}
                      className="p-3 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-2xl text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between min-h-[72px] touch-target group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                            {srv.subcategory_name || srv.category_name}
                          </span>
                          {srv.size_label && (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              {srv.size_label}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-sm leading-tight mt-1 group-hover:text-sky-600">
                          {srv.name}
                        </p>
                      </div>

                      <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
                        <span className="text-base font-black text-slate-900 group-hover:text-sky-600">
                          {formatINR(srv.rate)}
                        </span>
                        {srv.min_charge && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            min {formatINR(srv.min_charge)}
                          </span>
                        )}
                        {srv.unit_label && !srv.min_charge && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            /{srv.unit_label}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart Line Items & Payment Actions */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-300 shadow-sm sticky top-4">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {editingBillId ? 'Editing Bill' : 'Current Bill'}
                </CardTitle>
                <p className="text-xs text-slate-500">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in bill
                </p>
              </div>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                  <p className="font-semibold text-slate-600">No items added yet</p>
                  <p className="text-xs mt-1">
                    Tap any service tile on the left to add it in 1 tap!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => (
                    <div
                      key={`${item.service_id}-${idx}`}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">
                            {item.service_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatINR(item.unit_rate)} each
                            {item.min_charge && ` · min ${formatINR(item.min_charge)}`}
                          </p>
                        </div>
                        <span className="font-black text-base text-slate-900">
                          {formatINR(item.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        {item.isMinApplied ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            min {formatINR(item.min_charge)} applied
                          </span>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateItemQty(idx, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 touch-target"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-12 h-8 text-center font-bold bg-white border border-slate-300 rounded-lg text-sm"
                          />

                          <button
                            type="button"
                            onClick={() => updateItemQty(idx, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 touch-target"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sticky Bill Total */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-base font-bold text-slate-600">Total Amount:</span>
                  <span className="text-3xl font-black text-slate-900">
                    {formatINR(billTotal)}
                  </span>
                </div>

                {/* Big Payment Action Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      disabled={saving || cartItems.length === 0}
                      onClick={() => handleSaveBill('cash')}
                      className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-sm touch-target"
                    >
                      <Wallet className="w-5 h-5" />
                      <span>Cash</span>
                    </Button>

                    <Button
                      type="button"
                      disabled={saving || cartItems.length === 0}
                      onClick={() => handleSaveBill('upi')}
                      className="h-14 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-sm touch-target"
                    >
                      <Smartphone className="w-5 h-5" />
                      <span>UPI</span>
                    </Button>
                  </div>

                  <Button
                    type="button"
                    disabled={saving || cartItems.length === 0 || !isAccountCustomer}
                    onClick={() => handleSaveBill('account')}
                    variant="outline"
                    className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 touch-target ${
                      isAccountCustomer
                        ? 'border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100'
                        : 'opacity-50 cursor-not-allowed text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Add to Account {isAccountCustomer ? '' : '(Select Credit Customer First)'}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Entries List */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Today's Entries</h2>
            <p className="text-xs text-slate-500">
              {todayBills.length} {todayBills.length === 1 ? 'bill' : 'bills'} recorded today
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchBills()}
            className="gap-1 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>

        {todayBills.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No bills saved yet today</p>
            <p className="text-xs text-slate-400">Bills created today will appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayBills.map((bill) => {
              const displayName = bill.customer_name || (bill.token_no ? `#${bill.token_no}` : 'Walk-in');
              return (
                <Card key={bill.id} className="p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {bill.token_no ? (
                        <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-black text-base flex items-center justify-center">
                          #{bill.token_no}
                        </span>
                      ) : (
                        <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold text-sm flex items-center justify-center">
                          {bill.customer_name?.charAt(0).toUpperCase() || 'C'}
                        </span>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-base leading-tight">
                          {displayName}
                        </p>
                        {bill.phone && (
                          <p className="text-xs text-slate-400 font-medium">{bill.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{formatINR(bill.total)}</p>
                      <Badge
                        variant={
                          bill.payment_method === 'cash'
                            ? 'success'
                            : bill.payment_method === 'upi'
                            ? 'default'
                            : 'warning'
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {bill.payment_method}
                      </Badge>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 line-clamp-2">
                    {bill.items?.map((it, idx) => (
                      <span key={idx} className="mr-2">
                        {it.service_name} ×{it.quantity}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBill(bill)}
                      className="h-8 text-xs font-bold gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBill(bill.id)}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
