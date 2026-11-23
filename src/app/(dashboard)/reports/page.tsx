'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Truck,
  FileDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { subDays, startOfWeek, startOfMonth, format } from 'date-fns';
import { useReports } from '@/lib/api-hooks';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';

const PIE_COLORS = ['#0284c7', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#64748b'];

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
    profitCollected: 0,
    profitSales: 0,
    cashInHand: 0,
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

  const salesByCategory = (reportData?.salesByCategory || []).map((c: any) => ({
    name: c.category_name,
    value: parseInt(c.total_sales || 0),
  }));

  const iceCreamBySubcategory = reportData?.iceCreamBySubcategory || [];
  const totalIceCreamSales = iceCreamBySubcategory.reduce((sum: number, item: any) => sum + parseInt(item.total_sales || 0), 0);
  const totalIceCreamQty = iceCreamBySubcategory.reduce((sum: number, item: any) => sum + parseInt(item.total_quantity || 0), 0);

  const dailyTrend = reportData?.dailyTrend || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sales, collected cash vs UPI, profits, drawer cash reconciliation
          </p>
        </div>

        <a
          href="/api/export"
          className="inline-flex items-center justify-center gap-2 px-4 h-11 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs shadow-xs touch-target"
        >
          <FileDown className="w-4 h-4 text-slate-600" />
          <span>Export Backup (CSV)</span>
        </a>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'today' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => applyPreset('yesterday')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'yesterday' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => applyPreset('week')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'week' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => applyPreset('month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'month' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-target ${
              dateFilter === 'custom' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Custom Range
          </button>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t">
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

      {/* Main KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <Card className="p-4 bg-white border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Sales (Work Done)</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {formatINR(summary.totalSales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            All bills incl. credit & delivered tailoring
          </p>
        </Card>

        {/* Money Collected */}
        <Card className="p-4 bg-emerald-50/50 border-emerald-200">
          <p className="text-xs font-bold text-emerald-800 uppercase">Actual Money Collected</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
            {formatINR(summary.totalCollected)}
          </p>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex gap-2">
            <span>Cash: {formatINR(summary.cashCollected)}</span>
            <span>·</span>
            <span>UPI: {formatINR(summary.upiCollected)}</span>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-4 bg-red-50/50 border-red-200">
          <p className="text-xs font-bold text-red-800 uppercase">Total Expenses</p>
          <p className="text-2xl sm:text-3xl font-black text-red-900 mt-1">
            {formatINR(summary.totalExpenses)}
          </p>
          <p className="text-[11px] text-red-700 mt-1">
            Cash spent: {formatINR(summary.cashExpenses)}
          </p>
        </Card>

        {/* Net Profit */}
        <Card className="p-4 bg-sky-50/50 border-sky-200">
          <p className="text-xs font-bold text-sky-800 uppercase">Net Realized Profit</p>
          <p
            className={`text-2xl sm:text-3xl font-black mt-1 ${
              summary.profitCollected >= 0 ? 'text-sky-950' : 'text-red-600'
            }`}
          >
            {formatINR(summary.profitCollected)}
          </p>
          <p className="text-[11px] text-sky-700 mt-1">
            Collected ({formatINR(summary.totalCollected)}) - Exp ({formatINR(summary.totalExpenses)})
          </p>
        </Card>
      </div>

      {/* Secondary Financial Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Expected Sales Profit</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">
                {formatINR(summary.profitSales)}
              </p>
              <p className="text-[11px] text-slate-400">Sales - Total Expenses</p>
            </div>
            <TrendingUp className="w-6 h-6 text-slate-300" />
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Account Receivables</p>
              <p className="text-xl font-black text-amber-700 mt-0.5">
                {formatINR(summary.totalOutstanding)}
              </p>
              <p className="text-[11px] text-slate-400">All-time credit customer balance</p>
            </div>
            <CreditCard className="w-6 h-6 text-amber-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Vendor Payables</p>
              <p className="text-xl font-black text-blue-700 mt-0.5">
                {formatINR(summary.vendorPayables)}
              </p>
              <p className="text-[11px] text-slate-400">Delivered unpaid vendor stock</p>
            </div>
            <Truck className="w-6 h-6 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Day Close Drawer Reconciliation Card */}
      <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-700">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-slate-800 px-2 py-0.5 rounded">
              Daily Drawer Audit
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              Day Close Drawer Check ({formatISTDisplay(dayClose.date)})
            </h2>
            <p className="text-xs text-slate-400">
              Reconcile physical cash expected in your shop counter drawer
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase">Expected Cash in Drawer</span>
            <span className="text-3xl font-black text-emerald-400">
              {formatINR(dayClose.expectedDrawerCash)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 block font-semibold">Cash Collected (+)</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {formatINR(dayClose.cashCollected)}
            </span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 block font-semibold">Cash Expenses (-)</span>
            <span className="text-lg font-bold text-red-400 mt-1 block">
              {formatINR(dayClose.cashExpenses)}
            </span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 block font-semibold">UPI Collected (Bank)</span>
            <span className="text-lg font-bold text-sky-400 mt-1 block">
              {formatINR(dayClose.upiCollected)}
            </span>
          </div>
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl">
            <span className="text-emerald-300 block font-bold">Drawer Cash Net</span>
            <span className="text-lg font-black text-emerald-300 mt-1 block">
              {formatINR(dayClose.expectedDrawerCash)}
            </span>
          </div>
        </div>
      </Card>

      {/* Visual Charts: Daily Trend & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-5 bg-white">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Daily Trend (Sales vs Expenses)
            </CardTitle>
            <CardDescription className="text-xs">
              Daily revenue compared against shop expenditures
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64">
            {dailyTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend data for selected range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="display_date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => formatINR(val)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sales" name="Sales" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 p-5 bg-white">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Sales by Category
            </CardTitle>
            <CardDescription className="text-xs">
              Revenue distribution across the 3 businesses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64 flex flex-col items-center justify-center">
            {salesByCategory.length === 0 || salesByCategory.every((c: any) => c.value === 0) ? (
              <p className="text-xs text-slate-400">No sales recorded in this period</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {salesByCategory.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatINR(val)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Arun Ice Creams Sub-Category Breakdown */}
      <Card className="p-5 bg-white border-slate-200 shadow-xs">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Arun Ice Creams — Sales by Sub-Category</span>
              <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                {totalIceCreamQty} items sold
              </span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Breakdown of ice cream volumes and revenues across Bars, i-Cone, Tubs, Cups, and Specials
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold block">Total Ice Cream Sales</span>
            <span className="text-lg font-black text-rose-700">{formatINR(totalIceCreamSales)}</span>
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
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
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
