import { PricingType } from '@/types';

export interface CalculateAmountInput {
  pricing_type: PricingType;
  rate: number;
  min_charge?: number | null;
  quantity: number;
}

/**
 * Calculates item amount based on business pricing rules:
 * - FIXED: rate * quantity (quantity usually 1; ice cream may be N)
 * - PER_UNIT: rate * quantity
 * - PER_UNIT_MIN: max(rate * quantity, min_charge ?? 0)
 *
 * Rules & Constraints:
 * - Whole rupees only (integer).
 * - Quantity must be an integer > 0.
 * - Rate must be an integer >= 0.
 */
export function calculateAmount(input: CalculateAmountInput): number {
  const { pricing_type, rate, min_charge, quantity } = input;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be an integer greater than zero');
  }

  if (!Number.isInteger(rate) || rate < 0) {
    throw new Error('Rate must be a non-negative integer');
  }

  if (min_charge !== null && min_charge !== undefined) {
    if (!Number.isInteger(min_charge) || min_charge < 0) {
      throw new Error('Minimum charge must be a non-negative integer');
    }
  }

  switch (pricing_type) {
    case 'FIXED':
      return rate * quantity;

    case 'PER_UNIT':
      return rate * quantity;

    case 'PER_UNIT_MIN': {
      const standard = rate * quantity;
      const min = min_charge ?? 0;
      return Math.max(standard, min);
    }

    default: {
      const _exhaustiveCheck: never = pricing_type;
      throw new Error(`Unsupported pricing type: ${_exhaustiveCheck}`);
    }
  }
}

/**
 * Calculates the total amount for a collection of line items.
 */
export function calculateBillTotal(items: CalculateAmountInput[]): number {
  return items.reduce((sum, item) => sum + calculateAmount(item), 0);
}

