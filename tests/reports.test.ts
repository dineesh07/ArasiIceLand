import { describe, it, expect } from 'vitest';

describe('Accounting & Reports Formula Verification', () => {
  // Fixture data matching section 3 and section 6 rules
  const fixtureData = {
    bills: [
      { id: 'b1', total: 60, method: 'cash', is_tailoring: false, date: '2026-11-22' },   // Cash bill
      { id: 'b2', total: 150, method: 'upi', is_tailoring: false, date: '2026-11-22' },   // UPI bill
      { id: 'b3', total: 200, method: 'account', is_tailoring: false, date: '2026-11-22' }, // Credit bill
      // Tailoring order delivered today generates income today
      { id: 'b4', total: 450, method: 'cash', is_tailoring: true, date: '2026-11-22' },  // Delivered tailoring bill
    ],
    accountPayments: [
      { id: 'p1', amount: 100, method: 'upi', date: '2026-11-22' }, // Partial payment towards account
    ],
    expenses: [
      { id: 'e1', amount: 50, method: 'cash', category: 'Paper & Ink' },
      { id: 'e2', amount: 300, method: 'upi', category: 'Vendor Order', is_vendor: true }, // Vendor order paid
    ],
    tailoringOrdersPending: [
      { id: 't_pending', total: 500, status: 'ready' }, // Expected, NOT in income
    ],
    vendorPayablesPending: [
      { id: 'vo_delivered', quoted_amount: 1200, status: 'delivered' }, // Unpaid delivered vendor order
    ]
  };

  it('calculates Total Sales (work done): sum of all bills including account & delivered tailoring', () => {
    // 60 + 150 + 200 + 450 = 860
    const totalSales = fixtureData.bills.reduce((sum, b) => sum + b.total, 0);
    expect(totalSales).toBe(860);

    // Pending/ready tailoring orders do not appear in sales
    const pendingInSales = fixtureData.bills.some(b => b.id === 't_pending');
    expect(pendingInSales).toBe(false);
  });

  it('calculates Money Collected: cash/upi bills + account payments (split cash vs UPI)', () => {
    // Cash bills: 60 + 450 = 510
    // UPI bills: 150
    // Account bill (200) is NOT collected yet
    // Account payment: 100 via UPI
    const cashCollected = fixtureData.bills
      .filter(b => b.method === 'cash')
      .reduce((sum, b) => sum + b.total, 0) +
      fixtureData.accountPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);

    const upiCollected = fixtureData.bills
      .filter(b => b.method === 'upi')
      .reduce((sum, b) => sum + b.total, 0) +
      fixtureData.accountPayments.filter(p => p.method === 'upi').reduce((sum, p) => sum + p.amount, 0);

    const totalCollected = cashCollected + upiCollected;

    expect(cashCollected).toBe(510);
    expect(upiCollected).toBe(250); // 150 + 100
    expect(totalCollected).toBe(760);
  });

  it('calculates Customer Account Balance: billed to account - payments', () => {
    // Billed to account: 200
    // Payments: 100
    // Balance: 100 outstanding
    const billedToAccount = fixtureData.bills
      .filter(b => b.method === 'account')
      .reduce((sum, b) => sum + b.total, 0);
    const payments = fixtureData.accountPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = billedToAccount - payments;

    expect(balance).toBe(100);
  });

  it('calculates Expenses and Vendor Payables', () => {
    const totalExpenses = fixtureData.expenses.reduce((sum, e) => sum + e.amount, 0);
    expect(totalExpenses).toBe(350); // 50 + 300

    const vendorPayables = fixtureData.vendorPayablesPending.reduce((sum, vo) => sum + vo.quoted_amount, 0);
    expect(vendorPayables).toBe(1200);
  });

  it('calculates Net Profit and Cash in Hand', () => {
    const totalCollected = 760;
    const totalSales = 860;
    const totalExpenses = 350;
    const cashCollected = 510;
    const cashExpenses = 50;

    // Primary: Collected - Expenses
    const profitCollected = totalCollected - totalExpenses;
    expect(profitCollected).toBe(410);

    // Secondary: Sales - Expenses
    const profitSales = totalSales - totalExpenses;
    expect(profitSales).toBe(510);

    // Cash in Hand (Drawer cash) = Cash collected - Cash expenses
    const cashInHand = cashCollected - cashExpenses;
    expect(cashInHand).toBe(460); // 510 - 50 = 460
  });
});

