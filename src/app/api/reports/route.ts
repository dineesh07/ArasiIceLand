import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';
import { getActiveWorkspace } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || todayIST();
    const to = searchParams.get('to') || todayIST();

    // 1. Sales by category (for active workspace)
    const salesByCategory = await query(`
      select category_name, total_sales
      from get_sales_by_category($1, $2, $3)
    `, [from, to, workspace]);

    const totalSales = salesByCategory.reduce((sum: number, c: any) => sum + parseInt(c.total_sales || 0), 0);

    // 2. Money Collected (Cash vs UPI for active workspace)
    const collectedRes = await queryOne(`
      select cash_collected, upi_collected, total_collected
      from get_collected($1, $2, $3)
    `, [from, to, workspace]);

    const collected = {
      cash: parseInt(collectedRes?.cash_collected || 0),
      upi: parseInt(collectedRes?.upi_collected || 0),
      total: parseInt(collectedRes?.total_collected || 0),
    };

    // 3. Expenses by category (for active workspace)
    const expensesByCategory = await query(`
      select category_name, total_expense
      from get_expenses_by_category($1, $2, $3)
    `, [from, to, workspace]);

    const totalExpenses = expensesByCategory.reduce((sum: number, e: any) => sum + parseInt(e.total_expense || 0), 0);

    // Cash expenses for cash in hand formula
    const cashExpensesRes = await queryOne(`
      select coalesce(sum(amount), 0) as cash_expenses
      from expenses
      where deleted_at is null
        and expense_date between $1 and $2
        and method = 'cash'
        and workspace = $3
    `, [from, to, workspace]);
    const cashExpenses = parseInt(cashExpensesRes?.cash_expenses || 0);

    // 4. All-time balances
    const allCustomers = await query(`
      select coalesce(sum(get_customer_account_balance(id)), 0) as total_outstanding
      from customers
      where active = true and is_account = true and workspace = $1
    `, [workspace]);
    const totalOutstanding = parseInt(allCustomers[0]?.total_outstanding || 0);

    const vendorPayablesRes = await queryOne(`
      select coalesce(sum(quoted_amount), 0) as payables
      from vendor_orders
      where status = 'delivered' and workspace = $1
    `, [workspace]);
    const vendorPayables = parseInt(vendorPayablesRes?.payables || 0);

    // 5. Daily Trend (Sales vs Expenses by Day for active workspace)
    const dailyTrend = await query(`
      with dates as (
        select generate_series($1::date, $2::date, '1 day'::interval)::date as day
      ),
      day_sales as (
        select b.bill_date as day, coalesce(sum(bi.amount), 0) as sales
        from bills b
        join bill_items bi on bi.bill_id = b.id
        where b.deleted_at is null and b.bill_date between $1 and $2 and b.workspace = $3
        group by b.bill_date
      ),
      day_expenses as (
        select expense_date as day, coalesce(sum(amount), 0) as expenses
        from expenses
        where deleted_at is null and expense_date between $1 and $2 and workspace = $3
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
    `, [from, to, workspace]);

    // 6. Day Close drawer reconciliation for 'to' date
    const dayCloseDate = to;
    const dayCloseBills = await queryOne(`
      select 
        coalesce(sum(case when payment_method = 'cash' then total else 0 end), 0) as cash_bills,
        coalesce(sum(case when payment_method = 'upi' then total else 0 end), 0) as upi_bills
      from bills
      where bill_date = $1 and workspace = $2 and deleted_at is null
    `, [dayCloseDate, workspace]);

    const dayClosePayments = await queryOne(`
      select 
        coalesce(sum(case when method = 'cash' then amount else 0 end), 0) as cash_payments,
        coalesce(sum(case when method = 'upi' then amount else 0 end), 0) as upi_payments
      from account_payments
      where paid_on = $1 and workspace = $2 and deleted_at is null
    `, [dayCloseDate, workspace]);

    const dayCloseExpenses = await queryOne(`
      select 
        coalesce(sum(case when method = 'cash' then amount else 0 end), 0) as cash_expenses,
        coalesce(sum(case when method = 'upi' then amount else 0 end), 0) as upi_expenses
      from expenses
      where expense_date = $1 and workspace = $2 and deleted_at is null
    `, [dayCloseDate, workspace]);

    const dayCloseCashIn = parseInt(dayCloseBills?.cash_bills || 0) + parseInt(dayClosePayments?.cash_payments || 0);
    const dayCloseUpiIn = parseInt(dayCloseBills?.upi_bills || 0) + parseInt(dayClosePayments?.upi_payments || 0);
    const dayCloseCashOut = parseInt(dayCloseExpenses?.cash_expenses || 0);
    const expectedDrawerCash = dayCloseCashIn - dayCloseCashOut;

    // 7. Ice Cream Breakdown by Subcategory & Top Selling Items
    const iceCreamBySubcategory = await query(`
      select 
        coalesce(sub.name, 'Uncategorized') as subcategory_name,
        coalesce(sum(bi.amount), 0)::int as total_sales,
        coalesce(sum(bi.quantity), 0)::int as total_quantity
      from bills b
      join bill_items bi on bi.bill_id = b.id
      join services s on s.id = bi.service_id
      join categories c on c.id = s.category_id
      left join subcategories sub on sub.id = s.subcategory_id
      where b.deleted_at is null 
        and b.bill_date between $1 and $2
        and b.workspace = $3
        and c.name ilike '%ice%'
      group by coalesce(sub.name, 'Uncategorized'), sub.sort_order
      order by coalesce(sub.sort_order, 999) asc, total_sales desc
    `, [from, to, workspace]);

    // Top Selling Ice Creams in the selected period (by quantity & revenue)
    const topIceCreams = await query(`
      select 
        bi.service_name,
        coalesce(sub.name, 'Ice Cream') as subcategory_name,
        coalesce(sum(bi.quantity), 0)::int as total_quantity,
        coalesce(sum(bi.amount), 0)::int as total_sales
      from bills b
      join bill_items bi on bi.bill_id = b.id
      join services s on s.id = bi.service_id
      join categories c on c.id = s.category_id
      left join subcategories sub on sub.id = s.subcategory_id
      where b.deleted_at is null 
        and b.bill_date between $1 and $2
        and b.workspace = $3
        and c.name ilike '%ice%'
      group by bi.service_name, coalesce(sub.name, 'Ice Cream')
      order by total_quantity desc, total_sales desc
      limit 10
    `, [from, to, workspace]);

    // 8. Period Sales Comparisons (Today vs Yesterday, This Week vs Last Week, This Month vs Last Month)
    const comparisonsRes = await queryOne(`
      with 
      today_sales as (
        select coalesce(sum(total), 0)::int as val from bills 
        where deleted_at is null and bill_date = current_date and workspace = $1
      ),
      yesterday_sales as (
        select coalesce(sum(total), 0)::int as val from bills 
        where deleted_at is null and bill_date = current_date - interval '1 day' and workspace = $1
      ),
      this_week_sales as (
        select coalesce(sum(total), 0)::int as val from bills 
        where deleted_at is null and bill_date >= date_trunc('week', current_date)::date and workspace = $1
      ),
      last_week_sales as (
        select coalesce(sum(total), 0)::int as val from bills 
        where deleted_at is null 
          and bill_date >= (date_trunc('week', current_date) - interval '7 days')::date
          and bill_date < date_trunc('week', current_date)::date
          and workspace = $1
      ),
      this_month_sales as (
        select coalesce(sum(total), 0)::int as val from bills 
        where deleted_at is null and bill_date >= date_trunc('month', current_date)::date and workspace = $1
      ),
      last_month_sales as (
        select coalesce(sum(total), 0)::int as val from bills 
        where deleted_at is null 
          and bill_date >= (date_trunc('month', current_date) - interval '1 month')::date
          and bill_date < date_trunc('month', current_date)::date
          and workspace = $1
      )
      select 
        (select val from today_sales) as today,
        (select val from yesterday_sales) as yesterday,
        (select val from this_week_sales) as this_week,
        (select val from last_week_sales) as last_week,
        (select val from this_month_sales) as this_month,
        (select val from last_month_sales) as last_month
    `, [workspace]);

    const comparisons = {
      today: parseInt(comparisonsRes?.today || 0),
      yesterday: parseInt(comparisonsRes?.yesterday || 0),
      thisWeek: parseInt(comparisonsRes?.this_week || 0),
      lastWeek: parseInt(comparisonsRes?.last_week || 0),
      thisMonth: parseInt(comparisonsRes?.this_month || 0),
      lastMonth: parseInt(comparisonsRes?.last_month || 0),
    };

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
      iceCreamBySubcategory,
      topIceCreams,
      comparisons,
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
