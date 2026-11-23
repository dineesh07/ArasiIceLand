-- 1. SEED CATEGORIES
insert into categories (name, sort_order) values
  ('Internet Centre', 1),
  ('Ice Cream', 2),
  ('Tailoring', 3)
on conflict (name) do nothing;

-- 2. SEED EXPENSE CATEGORIES
insert into expense_categories (name) values
  ('Electricity'),
  ('Ice Cream Stock'),
  ('Printer Service'),
  ('Paper & Ink'),
  ('Rent'),
  ('Vendor Order'),
  ('Other')
on conflict (name) do nothing;

-- 3. SEED SETTINGS
insert into settings (id, shop_name, vendor_name, vendor_phone, shop_phone)
values (1, 'Shop Manager', 'Arun Ice Creams Distributor', '9876543210', '9840012345')
on conflict (id) do update set
  shop_name = excluded.shop_name,
  vendor_name = excluded.vendor_name,
  vendor_phone = excluded.vendor_phone,
  shop_phone = excluded.shop_phone;

-- 4. SEED SAMPLE SERVICES (Editable from UI by owner)
do $$
declare
  v_internet_id uuid;
  v_icecream_id uuid;
  v_tailoring_id uuid;
begin
  select id into v_internet_id from categories where name = 'Internet Centre';
  select id into v_icecream_id from categories where name = 'Ice Cream';
  select id into v_tailoring_id from categories where name = 'Tailoring';

  -- Internet Centre Services
  insert into services (category_id, name, pricing_type, unit_label, rate, min_charge, sort_order) values
    (v_internet_id, 'B/W Single Side', 'PER_UNIT_MIN', 'page', 2, 10, 1),
    (v_internet_id, 'B/W Double Side', 'PER_UNIT_MIN', 'page', 4, 10, 2),
    (v_internet_id, 'Colour Single Side', 'PER_UNIT', 'page', 10, null, 3),
    (v_internet_id, 'Colour Double Side', 'PER_UNIT', 'page', 15, null, 4),
    (v_internet_id, 'Typing', 'PER_UNIT', 'page', 20, null, 5),
    (v_internet_id, 'Community Certificate', 'FIXED', null, 150, null, 6),
    (v_internet_id, 'Aadhaar Print', 'FIXED', null, 50, null, 7),
    (v_internet_id, 'PAN Card Application', 'FIXED', null, 200, null, 8);

  -- Ice Cream Services
  insert into services (category_id, name, pricing_type, unit_label, rate, min_charge, sort_order) values
    (v_icecream_id, 'Vanilla Cup', 'FIXED', null, 25, null, 1),
    (v_icecream_id, 'Choco Bar', 'FIXED', null, 35, null, 2),
    (v_icecream_id, 'Butterscotch Cone', 'FIXED', null, 50, null, 3),
    (v_icecream_id, 'Kulfi', 'FIXED', null, 30, null, 4);

  -- Tailoring Services
  insert into services (category_id, name, pricing_type, unit_label, rate, min_charge, sort_order) values
    (v_tailoring_id, 'Blouse', 'FIXED', null, 250, null, 1),
    (v_tailoring_id, 'Lining Blouse', 'FIXED', null, 400, null, 2),
    (v_tailoring_id, 'Churidar Normal', 'FIXED', null, 450, null, 3),
    (v_tailoring_id, 'Churidar with Lining', 'FIXED', null, 650, null, 4);

  -- Vendor Products (for Ice Cream stock ordering)
  insert into vendor_products (name, unit, active) values
    ('Vanilla Cup (Carton of 24)', 'box', true),
    ('Choco Bar (Carton of 30)', 'box', true),
    ('Butterscotch Cone (Carton of 20)', 'box', true),
    ('Kulfi (Carton of 24)', 'box', true);
end;
$$;

