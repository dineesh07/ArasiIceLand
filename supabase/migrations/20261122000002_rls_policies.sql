-- Enable RLS on every table
alter table categories enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table tailoring_orders enable row level security;
alter table tailoring_order_items enable row level security;
alter table daily_token_counters enable row level security;
alter table bills enable row level security;
alter table bill_items enable row level security;
alter table account_payments enable row level security;
alter table expense_categories enable row level security;
alter table vendor_orders enable row level security;
alter table vendor_products enable row level security;
alter table vendor_order_items enable row level security;
alter table expenses enable row level security;
alter table settings enable row level security;

-- Owner-only access policies (all authenticated users have full access, unauthenticated/anon denied)
create policy "Owner access categories" on categories for all to authenticated using (true) with check (true);
create policy "Owner access services" on services for all to authenticated using (true) with check (true);
create policy "Owner access customers" on customers for all to authenticated using (true) with check (true);
create policy "Owner access tailoring_orders" on tailoring_orders for all to authenticated using (true) with check (true);
create policy "Owner access tailoring_order_items" on tailoring_order_items for all to authenticated using (true) with check (true);
create policy "Owner access daily_token_counters" on daily_token_counters for all to authenticated using (true) with check (true);
create policy "Owner access bills" on bills for all to authenticated using (true) with check (true);
create policy "Owner access bill_items" on bill_items for all to authenticated using (true) with check (true);
create policy "Owner access account_payments" on account_payments for all to authenticated using (true) with check (true);
create policy "Owner access expense_categories" on expense_categories for all to authenticated using (true) with check (true);
create policy "Owner access vendor_orders" on vendor_orders for all to authenticated using (true) with check (true);
create policy "Owner access vendor_products" on vendor_products for all to authenticated using (true) with check (true);
create policy "Owner access vendor_order_items" on vendor_order_items for all to authenticated using (true) with check (true);
create policy "Owner access expenses" on expenses for all to authenticated using (true) with check (true);
create policy "Owner access settings" on settings for all to authenticated using (true) with check (true);

