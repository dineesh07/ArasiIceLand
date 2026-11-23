-- Enable UUID generation extension
create extension if not exists "pgcrypto";

-- 1. CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. SERVICES
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  name text not null,
  active boolean default true,
  pricing_type text not null check (pricing_type in ('FIXED', 'PER_UNIT', 'PER_UNIT_MIN')),
  unit_label text null,
  rate int not null check (rate >= 0),
  min_charge int null check (min_charge is null or min_charge >= 0),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 3. CUSTOMERS
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text null,
  is_account boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- 4. TAILORING ORDERS
create table if not exists tailoring_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  received_on date not null,
  delivery_date date not null,
  status text not null default 'received' check (status in ('received', 'ready', 'delivered')),
  total int not null default 0 check (total >= 0),
  note text null,
  delivered_at timestamptz null,
  customer_id uuid null references customers(id),
  created_at timestamptz default now()
);

-- 5. TAILORING ORDER ITEMS
create table if not exists tailoring_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references tailoring_orders(id) on delete cascade,
  service_id uuid null references services(id),
  service_name text not null,
  quantity int not null check (quantity > 0),
  unit_rate int not null check (unit_rate >= 0),
  amount int not null check (amount >= 0),
  created_at timestamptz default now()
);

-- 6. DAILY TOKEN COUNTERS
create table if not exists daily_token_counters (
  bill_date date primary key,
  last_token int not null default 0
);

-- 7. BILLS
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  bill_date date not null,
  token_no int null,
  customer_id uuid null references customers(id),
  customer_name text null,
  phone text null,
  payment_method text not null check (payment_method in ('cash', 'upi', 'account')),
  total int not null check (total >= 0),
  tailoring_order_id uuid null references tailoring_orders(id),
  deleted_at timestamptz null,
  created_at timestamptz default now()
);

-- Partial unique index: Ensure tokens #1, #2... are unique per date for nameless bills.
-- Nameless bills get tokens; named/customer bills have null tokens and multiple nulls are allowed.
create unique index if not exists bills_bill_date_token_no_idx 
  on bills (bill_date, token_no) 
  where token_no is not null and deleted_at is null;

-- 8. BILL ITEMS
create table if not exists bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  service_id uuid null references services(id),
  category_id uuid not null references categories(id),
  service_name text not null,
  pricing_type text not null check (pricing_type in ('FIXED', 'PER_UNIT', 'PER_UNIT_MIN')),
  quantity int not null check (quantity > 0),
  unit_rate int not null check (unit_rate >= 0),
  min_charge int null check (min_charge is null or min_charge >= 0),
  amount int not null check (amount >= 0),
  created_at timestamptz default now()
);

-- 9. ACCOUNT PAYMENTS
create table if not exists account_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  amount int not null check (amount > 0),
  method text not null check (method in ('cash', 'upi')),
  paid_on date not null,
  note text null,
  deleted_at timestamptz null,
  created_at timestamptz default now()
);

-- 10. EXPENSE CATEGORIES
create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- 11. VENDOR ORDERS
create table if not exists vendor_orders (
  id uuid primary key default gen_random_uuid(),
  order_no int generated always as identity,
  order_date date not null,
  status text not null default 'ordered' check (status in ('ordered', 'delivered', 'paid')),
  quoted_amount int null check (quoted_amount is null or quoted_amount > 0),
  delivered_on date null,
  paid_on date null,
  payment_method text null check (payment_method is null or payment_method in ('cash', 'upi')),
  note text null,
  created_at timestamptz default now()
);

-- 12. VENDOR PRODUCTS
create table if not exists vendor_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text null,
  active boolean default true,
  created_at timestamptz default now()
);

-- 13. VENDOR ORDER ITEMS
create table if not exists vendor_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references vendor_orders(id) on delete cascade,
  product_name text not null,
  quantity numeric not null check (quantity > 0),
  unit text null,
  created_at timestamptz default now()
);

-- 14. EXPENSES
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  category_id uuid not null references expense_categories(id),
  amount int not null check (amount > 0),
  method text not null check (method in ('cash', 'upi')),
  note text null,
  vendor_order_id uuid null references vendor_orders(id),
  deleted_at timestamptz null,
  created_at timestamptz default now()
);

-- 15. SETTINGS
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'Shop Manager',
  vendor_name text null,
  vendor_phone text null,
  shop_phone text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

