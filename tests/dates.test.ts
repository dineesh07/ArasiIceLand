import { describe, it, expect } from 'vitest';
import { todayIST, formatISTDisplay, formatISTDateTime } from '@/lib/dates';
import { formatINR, formatToken } from '@/lib/formatters';

describe('IST Date Utilities', () => {
  it('returns valid ISO date string in YYYY-MM-DD format for IST', () => {
    const today = todayIST();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats dates into friendly Indian format', () => {
    const formatted = formatISTDisplay('2026-11-22');
    expect(formatted).toBe('22 Nov 2026');
  });

  it('formats date and time accurately', () => {
    const formatted = formatISTDateTime('2026-11-22T14:30:00Z');
    expect(formatted).toContain('2026');
  });
});

describe('Formatters', () => {
  it('formats whole Indian Rupees correctly with ₹ symbol and commas', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(5)).toBe('₹5');
    expect(formatINR(1250)).toBe('₹1,250');
    expect(formatINR(100000)).toBe('₹1,00,000');
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
  });

  it('formats token numbers as #N', () => {
    expect(formatToken(1)).toBe('#1');
    expect(formatToken(7)).toBe('#7');
    expect(formatToken(null)).toBe('');
    expect(formatToken(undefined)).toBe('');
  });
});

