import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || todayIST();
    const to = searchParams.get('to') || todayIST();

    // 1. Sales by category
    const salesByCategory = await query(`
      select category_name, total_sales
      from get_sales_by_category($1, $2)
    `, [from, to]);

    const totalSales = salesByCategory.reduce((sum: number, c: any) => sum + parseInt(c.total_sales || 0), 0);

    // 2. Money Collected (Cash vs UPI)
    const collectedRes = await queryOne(`
      select cash_collected, upi_collected, total_collected
      from get_collected($1, $2)
    `, [from, to]);

    const collected = {
      cash: parseInt(collectedRes?.cash_collected || 0),
      upi: parseInt(collectedRes?.upi_collected || 0),
      total: parseInt(collectedRes?.total_collected || 0),
    };

    // 3. Expenses by category
    const expensesByCategory = await query(`
      select category_name, total_expense
      from get_expenses_by_category($1, $2)
    `, [from, to]);

    const totalExpenses = expensesByCategory.reduce((sum: number, e: any) => sum + parseInt(e.total_expense || 0), 0);

    // Cash expenses for cash in hand formula
    const cashExpensesRes = await queryOne(`
      select coalesce(sum(amount), 0) as cash_expenses
      from expenses
      where deleted_at is null
        and expense_date between $1 and $2
        and method = 'cash'
    `, [from, to]);
    const cashExpenses = parseInt(cashExpensesRes?.cash_expenses || 0);

    // 4. All-time balances
    const allCustomers = await query(`
      select coalesce(sum(get_customer_account_balance(id)), 0) as total_outstanding
      from customers
      where active = true and is_account = true
    `);
    const totalOutstanding = parseInt(allCustomers[0]?.total_outstanding || 0);

    const vendorPayablesRes = await queryOne('select get_vendor_payables() as payables');
    const vendorPayables = parseInt(vendorPayablesRes?.payables || 0);

    // 5. Daily Trend (Sales vs Expenses by Day)
    const dailyTrend = await query(`
      with dates as (
        select generate_series($1::date, $2::date, '1 day'::interval)::date as day
      ),
      day_sales as (
        select b.bill_date as day, coalesce(sum(bi.amount), 0) as sales
        from bills b
        join bill_items bi on bi.bill_id = b.id
        where b.deleted_at is null and b.bill_date between $1 and $2
        group by b.bill_date
      ),
      day_expenses as (
        select expense_date as day, coalesce(sum(amount), 0) as expenses
        from expenses
        where deleted_at is null and expense_date between $1 and $2
        group by expense_date
      )
      select 
        to_char(d.day, 'YYYY-MM-DD') as date,
        to_char(d.day, 'DD Mon') as display_date,
        coalesce(ds.sales, 0)::int as sales,
        coalesce(de.expenses, 0)::int as expenses
      from dates d
      left join day_sales ds on ds.day = d.day
      left join day_expenses de on de.day = d.day
      order by d.day asc
    `, [from, to]);

    // 6. Day Close drawer reconciliation for 'to' date
    const dayCloseDate = to;
    const dayCloseBills = await queryOne(`
      select 
        coalesce(sum(case when payment_method = 'cash' then total else 0 end), 0) as cash_bills,
        coalesce(sum(case when payment_method = 'upi' then total else 0 end), 0) as upi_bills
      from bills
      where bill_date = $1 and deleted_at is null
    `, [dayCloseDate]);

    const dayClosePayments = await queryOne(`
      select 
        coalesce(sum(case when method = 'cash' then amount else 0 end), 0) as cash_payments,
        coalesce(sum(case when method = 'upi' then amount else 0 end), 0) as upi_payments
      from account_payments
      where paid_on = $1 and deleted_at is null
    `, [dayCloseDate]);

    const dayCloseExpenses = await queryOne(`
      select 
        coalesce(sum(case when method = 'cash' then amount else 0 end), 0) as cash_expenses,
        coalesce(sum(case when method = 'upi' then amount else 0 end), 0) as upi_expenses
      from expenses
      where expense_date = $1 and deleted_at is null
    `, [dayCloseDate]);

    const dayCloseCashIn = parseInt(dayCloseBills?.cash_bills || 0) + parseInt(dayClosePayments?.cash_payments || 0);
    const dayCloseUpiIn = parseInt(dayCloseBills?.upi_bills || 0) + parseInt(dayClosePayments?.upi_payments || 0);
    const dayCloseCashOut = parseInt(dayCloseExpenses?.cash_expenses || 0);
    const expectedDrawerCash = dayCloseCashIn - dayCloseCashOut;

    return NextResponse.json({
      from,
      to,
      summary: {
        totalSales,
        totalCollected: collected.total,
        cashCollected: collected.cash,
        upiCollected: collected.upi,
        totalExpenses,
        cashExpenses,
        profitCollected: collected.total - totalExpenses,
        profitSales: totalSales - totalExpenses,
        cashInHand: collected.cash - cashExpenses,
        totalOutstanding,
        vendorPayables,
      },
      salesByCategory,
      expensesByCategory,
      dailyTrend,
      dayClose: {
        date: dayCloseDate,
        cashCollected: dayCloseCashIn,
        upiCollected: dayCloseUpiIn,
        cashExpenses: dayCloseCashOut,
        expectedDrawerCash,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

