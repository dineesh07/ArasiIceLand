import { z } from 'zod';
import { Database } from './database';

export type Category = Database['public']['Tables']['categories']['Row'];
export type Subcategory = Database['public']['Tables']['subcategories']['Row'];
export type Service = Database['public']['Tables']['services']['Row'] & {
  category_name?: string;
  subcategory_name?: string | null;
  subcategory_sort_order?: number | null;
};
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Bill = Database['public']['Tables']['bills']['Row'];
export type BillItem = Database['public']['Tables']['bill_items']['Row'];
export type AccountPayment = Database['public']['Tables']['account_payments']['Row'];
export type TailoringOrder = Database['public']['Tables']['tailoring_orders']['Row'];
export type TailoringOrderItem = Database['public']['Tables']['tailoring_order_items']['Row'];
export type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type VendorOrder = Database['public']['Tables']['vendor_orders']['Row'];
export type VendorOrderItem = Database['public']['Tables']['vendor_order_items']['Row'];
export type VendorProduct = Database['public']['Tables']['vendor_products']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];

export type PricingType = 'FIXED' | 'PER_UNIT' | 'PER_UNIT_MIN';
export type PaymentMethod = 'cash' | 'upi' | 'account';

export const PricingTypeLabels: Record<PricingType, string> = {
  FIXED: 'Fixed price',
  PER_UNIT: 'Per unit',
  PER_UNIT_MIN: 'Per unit with minimum charge',
};

// Pricing calculation input
export interface CalculateAmountParams {
  pricing_type: PricingType;
  rate: number;
  min_charge?: number | null;
  quantity: number;
}

// Helper function for full display name
export function formatServiceName(name: string, sizeLabel?: string | null): string {
  if (sizeLabel && sizeLabel.trim()) {
    const trimmed = sizeLabel.trim();
    if (name.toLowerCase().endsWith(trimmed.toLowerCase())) {
      return name;
    }
    return `${name} ${trimmed}`;
  }
  return name;
}

// Zod schemas
export const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category_id: z.string().uuid('Category is required'),
  subcategory_id: z.string().uuid().optional().nullable(),
  size_label: z.string().optional().nullable(),
  pricing_type: z.enum(['FIXED', 'PER_UNIT', 'PER_UNIT_MIN']),
  unit_label: z.string().optional().nullable(),
  rate: z.number().int().nonnegative('Rate must be a positive integer'),
  min_charge: z.number().int().nonnegative('Min charge must be a positive integer').optional().nullable(),
  sort_order: z.number().int().default(0),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional().nullable(),
  is_account: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

