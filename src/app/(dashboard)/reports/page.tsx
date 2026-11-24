'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Truck,
  FileDown,
  Receipt,
  Banknote,
  Smartphone,
  Calendar,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { subDays, startOfWeek, startOfMonth, format } from 'date-fns';
import { useReports } from '@/lib/api-hooks';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';

interface CategorySale {
  name: string;
  sales: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Arun Ice Creams': '#0284c7', // Sky Blue
  'Internet Centre': '#10b981', // Emerald
  'Tailoring': '#a855f7',       // Purple
};

export default function ReportsPage() {
  const today = todayIST();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const { data: reportData } = useReports(fromDate, toDate);

  const applyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    setDateFilter(preset);
    const now = new Date();
    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === 'yesterday') {
      const y = format(subDays(now, 1), 'yyyy-MM-dd');
      setFromDate(y);
      setToDate(y);
    } else if (preset === 'week') {
      const w = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      setFromDate(w);
      setToDate(today);
    } else if (preset === 'month') {
      const m = format(startOfMonth(now), 'yyyy-MM-dd');
      setFromDate(m);
      setToDate(today);
    }
  };

  const summary = reportData?.summary || {
    totalSales: 0,
    totalCollected: 0,
    cashCollected: 0,
    upiCollected: 0,
    totalExpenses: 0,
    cashExpenses: 0,
    totalOutstanding: 0,
    vendorPayables: 0,
  };

  const dayClose = reportData?.dayClose || {
    date: toDate,
    cashCollected: 0,
    upiCollected: 0,
    cashExpenses: 0,
    expectedDrawerCash: 0,
  };

  const salesByCategory: CategorySale[] = (reportData?.salesByCategory || []).map((c: any) => ({
    name: c.category_name,
    sales: parseInt(c.total_sales || 0),
    color: CATEGORY_COLORS[c.category_name] || '#64748b',
  }));

  const iceCreamBySubcategory = reportData?.iceCreamBySubcategory || [];
  const totalIceCreamSales = iceCreamBySubcategory.reduce((sum: number, item: any) => sum + parseInt(item.total_sales || 0), 0);
  const totalIceCreamQty = iceCreamBySubcategory.reduce((sum: number, item: any) => sum + parseInt(item.total_quantity || 0), 0);

  const topIceCreams = (reportData?.topIceCreams || []) as Array<{
    service_name: string;
    subcategory_name: string;
    total_quantity: number;
    total_sales: number;
  }>;

  const comparisons = reportData?.comparisons || {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
  };

  // Data for the Day, Week, Month comparison chart
  const comparisonChartData = [
    {
      period: 'Day (Today vs Yesterday)',
      Current: comparisons.today,
      Previous: comparisons.yesterday,
      currentLabel: 'Today',
      prevLabel: 'Yesterday',
    },
    {
      period: 'Week (This vs Last Week)',
      Current: comparisons.thisWeek,
      Previous: comparisons.lastWeek,
      currentLabel: 'This Week',
      prevLabel: 'Last Week',
    },
    {
      period: 'Month (This vs Last Month)',
      Current: comparisons.thisMonth,
      Previous: comparisons.lastMonth,
      currentLabel: 'This Month',
      prevLabel: 'Last Month',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Reports & Insights</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Clear daily sales, top-selling ice creams & comparisons
          </p>
        </div>

        <a
          href="/api/export"
          className="inline-flex items-center justify-center gap-2 px-4 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs shadow-xs touch-target"
        >
          <FileDown className="w-4 h-4 text-slate-600" />
          <span>Export Backup (CSV)</span>
        </a>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'today' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => applyPreset('yesterday')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'yesterday' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => applyPreset('week')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'week' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => applyPreset('month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'month' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'custom' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Custom Range
          </button>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">From:</span>
              <CustomDatePicker
                value={fromDate}
                onChange={(val) => setFromDate(val)}
                className="h-10 text-xs font-bold bg-slate-50 w-44"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">To:</span>
              <CustomDatePicker
                value={toDate}
                onChange={(val) => setToDate(val)}
                className="h-10 text-xs font-bold bg-slate-50 w-44"
              />
            </div>
          </div>
        )}
      </div>

      {/* Simplified Key Cards (Easy to understand for mom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Sales */}
        <Card className="p-5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Sales</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {formatINR(summary.totalSales)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Total value of all customer bills created
          </p>
        </Card>

        {/* Money Collected */}
        <Card className="p-5 bg-white border border-emerald-200 shadow-xs bg-gradient-to-br from-emerald-50/40 via-white to-white">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Money Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-900 mt-2 tracking-tight">
            {formatINR(summary.totalCollected)}
          </p>
          <div className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-2">
            <span>Cash: <strong>{formatINR(summary.cashCollected)}</strong></span>
            <span>•</span>
            <span>UPI: <strong>{formatINR(summary.upiCollected)}</strong></span>
          </div>
        </Card>

        {/* Shop Expenses */}
        <Card className="p-5 bg-white border border-rose-200 shadow-xs bg-gradient-to-br from-rose-50/40 via-white to-white">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Shop Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-600 rotate-180" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-900 mt-2 tracking-tight">
            {formatINR(summary.totalExpenses)}
          </p>
          <p className="text-xs text-rose-700 mt-1 font-medium">
            Cash spent: <strong>{formatINR(summary.cashExpenses)}</strong>
          </p>
        </Card>
      </div>

      {/* Customer Credit & Vendor Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5 bg-white border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Customer Credit Due (Receivables)</p>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {formatINR(summary.totalOutstanding)}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Money pending from credit customers</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-white border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Arun Ice Creams Bills to Pay</p>
              <p className="text-2xl font-black text-blue-900 mt-1">
                {formatINR(summary.vendorPayables)}
              </p>
              <p className="text-xs text-blue-700 mt-0.5">Unpaid stock delivered by vendor</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Day Close Drawer Audit (Simplified: Cash In vs Cash Out = Physical Cash in Drawer) */}
      <Card className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-md">
              Counter Drawer Check
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              Cash Drawer Reconcile ({formatISTDisplay(dayClose.date)})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Physical cash you should have in the shop drawer right now
            </p>
          </div>

          <div className="text-left sm:text-right bg-emerald-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Expected Cash in Drawer</span>
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600">
              {formatINR(dayClose.expectedDrawerCash)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-slate-500 block font-semibold">1. Cash Collected In (+)</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {formatINR(dayClose.cashCollected)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">From counter cash sales</span>
          </div>
          <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-xl">
            <span className="text-rose-700 block font-semibold">2. Cash Spent Out (-)</span>
            <span className="text-lg font-black text-rose-700 mt-1 block">
              {formatINR(dayClose.cashExpenses)}
            </span>
            <span className="text-[11px] text-rose-600/80 mt-0.5 block">Paid out from drawer</span>
          </div>
          <div className="p-3.5 bg-sky-50/60 border border-sky-200/80 rounded-xl">
            <span className="text-sky-700 block font-semibold">3. UPI Online (Bank)</span>
            <span className="text-lg font-black text-sky-800 mt-1 block">
              {formatINR(dayClose.upiCollected)}
            </span>
            <span className="text-[11px] text-sky-600/80 mt-0.5 block">Already in bank account</span>
          </div>
        </div>
      </Card>

      {/* Comparisons Chart: Day, Week, and Month */}
      <Card className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <CardHeader className="p-0 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>Sales Comparisons (Day, Week & Month)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Simple comparison of current sales vs previous periods
              </CardDescription>
            </div>

            {/* Quick summary chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg font-bold border border-sky-100">
                Today: {formatINR(comparisons.today)}
              </span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-bold border border-purple-100">
                This Week: {formatINR(comparisons.thisWeek)}
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-100">
                This Month: {formatINR(comparisons.thisMonth)}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* 3 Summary Comparison Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Day */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase block">Today vs Yesterday</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-xl font-black text-slate-900">{formatINR(comparisons.today)}</span>
              <span className="text-xs text-slate-500 font-medium">Y'day: {formatINR(comparisons.yesterday)}</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold flex items-center gap-1">
              {comparisons.today >= comparisons.yesterday ? (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{formatINR(comparisons.today - comparisons.yesterday)} higher
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  -{formatINR(comparisons.yesterday - comparisons.today)} lower
                </span>
              )}
            </div>
          </div>

          {/* Week */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase block">This Week vs Last Week</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-xl font-black text-slate-900">{formatINR(comparisons.thisWeek)}</span>
              <span className="text-xs text-slate-500 font-medium">Last: {formatINR(comparisons.lastWeek)}</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold flex items-center gap-1">
              {comparisons.thisWeek >= comparisons.lastWeek ? (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{formatINR(comparisons.thisWeek - comparisons.lastWeek)} higher
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  -{formatINR(comparisons.lastWeek - comparisons.thisWeek)} lower
                </span>
              )}
            </div>
          </div>

          {/* Month */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase block">This Month vs Last Month</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-xl font-black text-slate-900">{formatINR(comparisons.thisMonth)}</span>
              <span className="text-xs text-slate-500 font-medium">Last: {formatINR(comparisons.lastMonth)}</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold flex items-center gap-1">
              {comparisons.thisMonth >= comparisons.lastMonth ? (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{formatINR(comparisons.thisMonth - comparisons.lastMonth)} higher
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  -{formatINR(comparisons.lastMonth - comparisons.thisMonth)} lower
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Clean Comparison Bar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="period" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(val: number) => formatINR(val)}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="Current" name="Current Period (Today / This Week / This Month)" fill="#0284c7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Previous" name="Previous Period (Yesterday / Last Week / Last Month)" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two Column Layout: Sales by Category (BAR CHART) & Most Popular Ice Creams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales by Category — Clean BAR CHART (as requested) */}
        <Card className="lg:col-span-6 p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-extrabold text-slate-900">
                Sales by Category
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Total sales comparison across the 3 main business sections
              </CardDescription>
            </CardHeader>

            {salesByCategory.length === 0 || salesByCategory.every((c: CategorySale) => c.sales === 0) ? (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">
                No sales recorded in this period.
              </div>
            ) : (
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#334155' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(val: number) => formatINR(val)}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="sales" name="Sales (₹)" radius={[8, 8, 0, 0]}>
                      {salesByCategory.map((entry: CategorySale, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Legend with Total Numbers */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            {salesByCategory.map((cat: CategorySale, idx: number) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block truncate">{cat.name}</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{formatINR(cat.sales)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Most Popular Ice Creams (What ice cream is bought most) */}
        <Card className="lg:col-span-6 p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Most Popular Ice Creams</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Top selling ice cream flavors for this selected period
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
              {topIceCreams.length} items
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {topIceCreams.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                <Award className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600 text-sm">No ice cream sales yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Top-selling ice creams for this period will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[19rem] overflow-y-auto pr-1">
                {topIceCreams.map((item, idx) => {
                  const maxQty = topIceCreams[0]?.total_quantity || 1;
                  const barWidth = Math.max(12, Math.round((item.total_quantity / maxQty) * 100));

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                              idx === 0
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-800'
                                : idx === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {item.service_name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.subcategory_name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-black text-slate-900 text-xs">
                            {item.total_quantity} {item.total_quantity === 1 ? 'unit' : 'units'}
                          </p>
                          <span className="text-[11px] text-sky-700 font-bold">
                            {formatINR(item.total_sales)}
                          </span>
                        </div>
                      </div>

                      {/* Mini popularity bar */}
                      <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Arun Ice Creams Sub-Category Breakdown Table */}
      <Card className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>Arun Ice Creams — Sub-Category Breakdown</span>
              <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full font-bold">
                {totalIceCreamQty} total items sold
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Breakdown across Cups, Bars, i-Cone, Tubs, and Specialities
            </CardDescription>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 font-semibold block">Total Ice Cream Sales</span>
            <span className="text-lg font-black text-sky-700">{formatINR(totalIceCreamSales)}</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {iceCreamBySubcategory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No ice cream sales recorded in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold">
                    <th className="py-2.5 px-4">Sub-Category</th>
                    <th className="py-2.5 px-4 text-center">Quantity Sold</th>
                    <th className="py-2.5 px-4 text-right">Revenue (₹)</th>
                    <th className="py-2.5 px-4 text-right">% of Ice Cream</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {iceCreamBySubcategory.map((item: any, idx: number) => {
                    const sales = parseInt(item.total_sales || 0);
                    const pct = totalIceCreamSales > 0 ? ((sales / totalIceCreamSales) * 100).toFixed(1) : '0';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                          <span>{item.subcategory_name}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {item.total_quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          {formatINR(sales)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 font-semibold">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
