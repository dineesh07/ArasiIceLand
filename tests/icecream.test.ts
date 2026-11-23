import { describe, it, expect } from 'vitest';
import { formatServiceName, serviceSchema } from '@/types';
import { calculateAmount } from '@/lib/pricing';

describe('Arun Ice Creams Logic & Display Names', () => {
  it('formats display name without size label', () => {
    expect(formatServiceName('Kulfi King')).toBe('Kulfi King');
    expect(formatServiceName('Chocobar', null)).toBe('Chocobar');
    expect(formatServiceName('Fun Wheel', '')).toBe('Fun Wheel');
  });

  it('formats display name with size label according to specification rule', () => {
    expect(formatServiceName('Double Chocolate', '100 ml')).toBe('Double Chocolate 100 ml');
    expect(formatServiceName('Vanilla Cup', '85 ml')).toBe('Vanilla Cup 85 ml');
    expect(formatServiceName('Almond Crisp', '1000 ml')).toBe('Almond Crisp 1000 ml');
  });

  it('calculates fixed price items accurately for quantities', () => {
    expect(
      calculateAmount({
        pricing_type: 'FIXED',
        rate: 60,
        quantity: 1,
      })
    ).toBe(60);

    expect(
      calculateAmount({
        pricing_type: 'FIXED',
        rate: 35,
        quantity: 3,
      })
    ).toBe(105);

    expect(
      calculateAmount({
        pricing_type: 'FIXED',
        rate: 320,
        quantity: 2,
      })
    ).toBe(640);
  });

  it('validates ice cream service with subcategory and size label in schema', () => {
    const validItem = {
      name: 'Blackcurrant',
      category_id: '11111111-1111-1111-1111-111111111111',
      subcategory_id: '22222222-2222-2222-2222-222222222222',
      size_label: '100 ml',
      pricing_type: 'FIXED' as const,
      unit_label: 'piece',
      rate: 60,
      min_charge: null,
      sort_order: 1,
    };

    const parsed = serviceSchema.safeParse(validItem);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Blackcurrant');
      expect(parsed.data.size_label).toBe('100 ml');
    }
  });
});

