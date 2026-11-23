'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todayIST } from '@/lib/dates';

// 1. Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.categories || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// 2. Services
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      return data.services || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// 3. Customers
export function useCustomers(accountsOnly = false) {
  return useQuery({
    queryKey: ['customers', { accountsOnly }],
    queryFn: async () => {
      const res = await fetch(`/api/customers?accountsOnly=${accountsOnly}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      return {
        customers: data.customers || [],
        totalOutstanding: data.totalOutstanding || 0,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// 4. Customer Detail
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch customer detail');
      return await res.json();
    },
    staleTime: 1000 * 60 * 1,
    enabled: !!id,
  });
}

// 5. Bills
export function useBills(date = todayIST()) {
  return useQuery({
    queryKey: ['bills', date],
    queryFn: async () => {
      const res = await fetch(`/api/bills?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch bills');
      const data = await res.json();
      return {
        bills: data.bills || [],
        summary: data.summary || { cash_total: 0, upi_total: 0, account_total: 0, grand_total: 0 },
      };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

// 6. Token Preview
export function useTokenPreview() {
  return useQuery({
    queryKey: ['token-preview'],
    queryFn: async () => {
      const res = await fetch('/api/tokens/preview');
      if (!res.ok) throw new Error('Failed to preview token');
      return await res.json();
    },
    staleTime: 1000 * 30,
  });
}

// 7. Tailoring Orders
export function useTailoringOrders() {
  return useQuery({
    queryKey: ['tailoring-orders'],
    queryFn: async () => {
      const res = await fetch('/api/tailoring');
      if (!res.ok) throw new Error('Failed to fetch tailoring orders');
      const data = await res.json();
      return {
        orders: data.orders || [],
        overdueCount: data.overdueCount || 0,
        pendingTotal: data.pendingTotal || 0,
      };
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// 8. Expenses
export function useExpenses(month: string, categoryId = 'all') {
  return useQuery({
    queryKey: ['expenses', month, categoryId],
    queryFn: async () => {
      let url = `/api/expenses?month=${month}`;
      if (categoryId !== 'all') {
        url += `&categoryId=${categoryId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      return {
        expenses: data.expenses || [],
        total: data.total || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

// 9. Expense Categories
export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await fetch('/api/expense-categories');
      if (!res.ok) throw new Error('Failed to fetch expense categories');
      const data = await res.json();
      return data.categories || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// 10. Vendor Orders
export function useVendorOrders() {
  return useQuery({
    queryKey: ['vendor-orders'],
    queryFn: async () => {
      const res = await fetch('/api/vendor-orders');
      if (!res.ok) throw new Error('Failed to fetch vendor orders');
      const data = await res.json();
      return {
        orders: data.orders || [],
        payables: data.payables || 0,
        settings: data.settings || {},
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

// 11. Vendor Products
export function useVendorProducts() {
  return useQuery({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const res = await fetch('/api/vendor-products');
      if (!res.ok) throw new Error('Failed to fetch vendor products');
      const data = await res.json();
      return data.products || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// 12. Reports
export function useReports(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return await res.json();
    },
    staleTime: 1000 * 60 * 2,
  });
}

// 13. Settings
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      return data.settings || {};
    },
    staleTime: 1000 * 60 * 10,
  });
}

// 14. Subcategories
export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ['subcategories', { categoryId }],
    queryFn: async () => {
      const url = categoryId ? `/api/subcategories?categoryId=${categoryId}` : '/api/subcategories';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch subcategories');
      const data = await res.json();
      return data.subcategories || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}


