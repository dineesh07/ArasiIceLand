-- 1. Sales by category (from_date to to_date)
create or replace function get_sales_by_category(p_from date, p_to date)
returns table (
  category_name text,
  total_sales bigint
)
language sql
security definer
as $$
  select 
    c.name as category_name,
    coalesce(sum(bi.amount), 0)::bigint as total_sales
  from categories c
  left join bill_items bi on bi.category_id = c.id
  left join bills b on b.id = bi.bill_id and b.deleted_at is null and b.bill_date between p_from and p_to
  group by c.id, c.name, c.sort_order
  order by c.sort_order;
$$;

-- 2. Money Collected (bills cash/upi + account payments cash/upi)
create or replace function get_collected(p_from date, p_to date)
returns table (
  cash_collected bigint,
  upi_collected bigint,
  total_collected bigint
)
language sql
security definer
as $$
  with bills_collected as (
    select
      coalesce(sum(case when payment_method = 'cash' then total else 0 end), 0) as cash,
      coalesce(sum(case when payment_method = 'upi' then total else 0 end), 0) as upi
    from bills
    where deleted_at is null
      and bill_date between p_from and p_to
      and payment_method in ('cash', 'upi')
  ),
  payments_collected as (
    select
      coalesce(sum(case when method = 'cash' then amount else 0 end), 0) as cash,
      coalesce(sum(case when method = 'upi' then amount else 0 end), 0) as upi
    from account_payments
    where deleted_at is null
      and paid_on between p_from and p_to
  )
  select
    (b.cash + p.cash)::bigint as cash_collected,
    (b.upi + p.upi)::bigint as upi_collected,
    (b.cash + p.cash + b.upi + p.upi)::bigint as total_collected
  from bills_collected b, payments_collected p;
$$;

-- 3. Expenses by category (excluding soft-deleted)
create or replace function get_expenses_by_category(p_from date, p_to date)
returns table (
  category_name text,
  total_expense bigint
)
language sql
security definer
as $$
  select
    ec.name as category_name,
    coalesce(sum(e.amount), 0)::bigint as total_expense
  from expense_categories ec
  left join expenses e on e.category_id = ec.id and e.deleted_at is null and e.expense_date between p_from and p_to
  group by ec.id, ec.name
  order by total_expense desc;
$$;

-- 4. Customer Account Balance (Billed to account - Account payments)
create or replace function get_customer_account_balance(p_customer_id uuid)
returns int
language sql
security definer
as $$
  with total_billed as (
    select coalesce(sum(total), 0) as amount
    from bills
    where customer_id = p_customer_id
      and payment_method = 'account'
      and deleted_at is null
  ),
  total_paid as (
    select coalesce(sum(amount), 0) as amount
    from account_payments
    where customer_id = p_customer_id
      and deleted_at is null
  )
  select ((select amount from total_billed) - (select amount from total_paid))::int;
$$;

-- 5. Vendor Payables (Quoted amount where status = 'delivered')
create or replace function get_vendor_payables()
returns int
language sql
security definer
as $$
  select coalesce(sum(quoted_amount), 0)::int
  from vendor_orders
  where status = 'delivered';
$$;

