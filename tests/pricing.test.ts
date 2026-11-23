import { describe, it, expect } from 'vitest';
import { calculateAmount, calculateBillTotal } from '@/lib/pricing';

describe('Pricing Engine (calculateAmount)', () => {
  describe('PER_UNIT_MIN (Printout logic)', () => {
    // Example from requirements: B/W single side: rate 2, min 10
    const bwConfig = {
      pricing_type: 'PER_UNIT_MIN' as const,
      rate: 2,
      min_charge: 10,
    };

    it('1 page = ₹10 (minimum charge applied)', () => {
      expect(calculateAmount({ ...bwConfig, quantity: 1 })).toBe(10);
    });

    it('5 pages = ₹10 (2 * 5 = 10, matches minimum charge)', () => {
      expect(calculateAmount({ ...bwConfig, quantity: 5 })).toBe(10);
    });

    it('8 pages = ₹16 (2 * 8 = 16, exceeds minimum charge)', () => {
      expect(calculateAmount({ ...bwConfig, quantity: 8 })).toBe(16);
    });

    it('50 pages = ₹100 (2 * 50 = 100, exceeds minimum charge)', () => {
      expect(calculateAmount({ ...bwConfig, quantity: 50 })).toBe(100);
    });

    it('handles null/undefined min_charge by defaulting to 0', () => {
      expect(
        calculateAmount({
          pricing_type: 'PER_UNIT_MIN',
          rate: 5,
          min_charge: null,
          quantity: 3,
        })
      ).toBe(15);
    });
  });

  describe('PER_UNIT (Typing / per page services)', () => {
    it('Typing PER_UNIT rate 20 -> 3 pages = ₹60', () => {
      expect(
        calculateAmount({
          pricing_type: 'PER_UNIT',
          rate: 20,
          quantity: 3,
        })
      ).toBe(60);
    });

    it('Colour printout PER_UNIT rate 10 -> 1 page = ₹10', () => {
      expect(
        calculateAmount({
          pricing_type: 'PER_UNIT',
          rate: 10,
          quantity: 1,
        })
      ).toBe(10);
    });
  });

  describe('FIXED (Govt applications and Ice creams)', () => {
    it('Govt application FIXED 150 -> 1 = ₹150', () => {
      expect(
        calculateAmount({
          pricing_type: 'FIXED',
          rate: 150,
          quantity: 1,
        })
      ).toBe(150);
    });

    it('Ice cream FIXED 30 x 3 = ₹90', () => {
      expect(
        calculateAmount({
          pricing_type: 'FIXED',
          rate: 30,
          quantity: 3,
        })
      ).toBe(90);
    });

    it('Tailoring Blouse FIXED 250 x 2 = ₹500', () => {
      expect(
        calculateAmount({
          pricing_type: 'FIXED',
          rate: 250,
          quantity: 2,
        })
      ).toBe(500);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('rejects quantity 0', () => {
      expect(() =>
        calculateAmount({
          pricing_type: 'FIXED',
          rate: 50,
          quantity: 0,
        })
      ).toThrow('Quantity must be an integer greater than zero');
    });

    it('rejects negative quantity', () => {
      expect(() =>
        calculateAmount({
          pricing_type: 'PER_UNIT',
          rate: 20,
          quantity: -3,
        })
      ).toThrow('Quantity must be an integer greater than zero');
    });

    it('rejects decimal / non-integer quantity', () => {
      expect(() =>
        calculateAmount({
          pricing_type: 'PER_UNIT',
          rate: 20,
          quantity: 2.5,
        })
      ).toThrow('Quantity must be an integer greater than zero');
    });

    it('rejects negative rates', () => {
      expect(() =>
        calculateAmount({
          pricing_type: 'FIXED',
          rate: -10,
          quantity: 1,
        })
      ).toThrow('Rate must be a non-negative integer');
    });
  });

  describe('Bill Total calculation', () => {
    it('accurately computes total across mixed pricing types', () => {
      const items = [
        { pricing_type: 'PER_UNIT_MIN' as const, rate: 2, min_charge: 10, quantity: 3 }, // 10
        { pricing_type: 'PER_UNIT' as const, rate: 20, quantity: 2 },                      // 40
        { pricing_type: 'FIXED' as const, rate: 35, quantity: 2 },                         // 70
      ];
      expect(calculateBillTotal(items)).toBe(120);
    });
  });
});

