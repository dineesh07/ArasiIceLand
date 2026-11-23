import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Bills with items
    const bills = await query(`
      select 
        b.bill_date, b.token_no, coalesce(b.customer_name, c.name, 'Walk-in') as customer,
        b.phone, b.payment_method, b.total, bi.service_name, bi.quantity, bi.unit_rate, bi.amount
      from bills b
      left join customers c on c.id = b.customer_id
      join bill_items bi on bi.bill_id = b.id
      where b.deleted_at is null
      order by b.bill_date desc, b.created_at desc
    `);

    // 2. Expenses
    const expenses = await query(`
      select 
        e.expense_date, ec.name as category, e.amount, e.method, e.note
      from expenses e
      join expense_categories ec on ec.id = e.category_id
      where e.deleted_at is null
      order by e.expense_date desc
    `);

    // 3. Payments
    const payments = await query(`
      select 
        p.paid_on, c.name as customer, p.amount, p.method, p.note
      from account_payments p
      join customers c on c.id = p.customer_id
      where p.deleted_at is null
      order by p.paid_on desc
    `);

    let csv = '--- BILLS & SALES ---\n';
    csv += 'Date,Token,Customer,Phone,Payment Method,Service,Qty,Rate,Amount,Bill Total\n';
    for (const b of bills) {
      csv += `"${b.bill_date}","${b.token_no ? '#' + b.token_no : ''}","${b.customer || ''}","${b.phone || ''}","${b.payment_method}","${b.service_name}","${b.quantity}","${b.unit_rate}","${b.amount}","${b.total}"\n`;
    }

    csv += '\n--- EXPENSES ---\n';
    csv += 'Date,Category,Amount,Payment Method,Note\n';
    for (const e of expenses) {
      csv += `"${e.expense_date}","${e.category}","${e.amount}","${e.method}","${e.note || ''}"\n`;
    }

    csv += '\n--- ACCOUNT PAYMENTS ---\n';
    csv += 'Date,Customer,Amount,Payment Method,Note\n';
    for (const p of payments) {
      csv += `"${p.paid_on}","${p.customer}","${p.amount}","${p.method}","${p.note || ''}"\n`;
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shop-backup-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

