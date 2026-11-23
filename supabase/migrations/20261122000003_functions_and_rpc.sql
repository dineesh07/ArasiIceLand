-- 1. Atomic Next Token Generator
create or replace function next_token(p_date date)
returns int
language plpgsql
security definer
as $$
declare
  v_token int;
begin
  insert into daily_token_counters (bill_date, last_token)
  values (p_date, 1)
  on conflict (bill_date)
  do update set last_token = daily_token_counters.last_token + 1
  returning last_token into v_token;

  return v_token;
end;
$$;

-- 2. Create Bill with Server-Side Recomputation & Atomic Token
create or replace function create_bill(
  p_date date,
  p_customer_id uuid,
  p_name text,
  p_phone text,
  p_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_bill_id uuid;
  v_token_no int := null;
  v_item jsonb;
  v_service_id uuid;
  v_category_id uuid;
  v_service_name text;
  v_pricing_type text;
  v_unit_rate int;
  v_min_charge int;
  v_quantity int;
  v_calc_amount int;
  v_total int := 0;
  v_is_account boolean;
  v_result jsonb;
begin
  -- Validate payment method
  if p_method not in ('cash', 'upi', 'account') then
    raise exception 'Invalid payment method: %', p_method;
  end if;

  -- Validate account customer
  if p_method = 'account' then
    if p_customer_id is null then
      raise exception 'Account payment requires a selected customer';
    end if;
    select is_account into v_is_account from customers where id = p_customer_id;
    if v_is_account is not true then
      raise exception 'Customer is not configured as an account customer';
    end if;
  end if;

  -- Token logic: If nameless and no customer, allocate next_token(p_date).
  -- If customer name or customer_id exists, token remains null.
  if (p_name is null or trim(p_name) = '') and p_customer_id is null then
    v_token_no := next_token(p_date);
  end if;

  -- Verify items array is non-empty
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Bill must have at least one item';
  end if;

  -- Pre-calculate total and validate items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pricing_type := v_item->>'pricing_type';
    v_unit_rate := (v_item->>'unit_rate')::int;
    v_quantity := (v_item->>'quantity')::int;
    v_min_charge := case when v_item->>'min_charge' is not null then (v_item->>'min_charge')::int else null end;

    if v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;

    if v_pricing_type = 'FIXED' or v_pricing_type = 'PER_UNIT' then
      v_calc_amount := v_unit_rate * v_quantity;
    elsif v_pricing_type = 'PER_UNIT_MIN' then
      v_calc_amount := greatest(v_unit_rate * v_quantity, coalesce(v_min_charge, 0));
    else
      raise exception 'Unknown pricing type: %', v_pricing_type;
    end if;

    v_total := v_total + v_calc_amount;
  end loop;

  -- Insert bill
  insert into bills (
    bill_date,
    token_no,
    customer_id,
    customer_name,
    phone,
    payment_method,
    total
  ) values (
    p_date,
    v_token_no,
    p_customer_id,
    case when trim(p_name) = '' then null else trim(p_name) end,
    case when trim(p_phone) = '' then null else trim(p_phone) end,
    p_method,
    v_total
  ) returning id into v_bill_id;

  -- Insert bill items with server-calculated amounts
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_service_id := case when v_item->>'service_id' is not null then (v_item->>'service_id')::uuid else null end;
    v_category_id := (v_item->>'category_id')::uuid;
    v_service_name := v_item->>'service_name';
    v_pricing_type := v_item->>'pricing_type';
    v_unit_rate := (v_item->>'unit_rate')::int;
    v_quantity := (v_item->>'quantity')::int;
    v_min_charge := case when v_item->>'min_charge' is not null then (v_item->>'min_charge')::int else null end;

    if v_pricing_type = 'FIXED' or v_pricing_type = 'PER_UNIT' then
      v_calc_amount := v_unit_rate * v_quantity;
    else
      v_calc_amount := greatest(v_unit_rate * v_quantity, coalesce(v_min_charge, 0));
    end if;

    insert into bill_items (
      bill_id,
      service_id,
      category_id,
      service_name,
      pricing_type,
      quantity,
      unit_rate,
      min_charge,
      amount
    ) values (
      v_bill_id,
      v_service_id,
      v_category_id,
      v_service_name,
      v_pricing_type,
      v_quantity,
      v_unit_rate,
      v_min_charge,
      v_calc_amount
    );
  end loop;

  select jsonb_build_object(
    'id', b.id,
    'bill_date', b.bill_date,
    'token_no', b.token_no,
    'customer_name', b.customer_name,
    'phone', b.phone,
    'payment_method', b.payment_method,
    'total', b.total
  ) into v_result
  from bills b
  where b.id = v_bill_id;

  return v_result;
end;
$$;

-- 3. Update Bill
create or replace function update_bill(
  p_bill_id uuid,
  p_customer_id uuid,
  p_name text,
  p_phone text,
  p_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item jsonb;
  v_service_id uuid;
  v_category_id uuid;
  v_service_name text;
  v_pricing_type text;
  v_unit_rate int;
  v_min_charge int;
  v_quantity int;
  v_calc_amount int;
  v_total int := 0;
  v_is_account boolean;
  v_result jsonb;
begin
  if p_method not in ('cash', 'upi', 'account') then
    raise exception 'Invalid payment method: %', p_method;
  end if;

  if p_method = 'account' then
    if p_customer_id is null then
      raise exception 'Account payment requires a selected customer';
    end if;
    select is_account into v_is_account from customers where id = p_customer_id;
    if v_is_account is not true then
      raise exception 'Customer is not configured as an account customer';
    end if;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Bill must have at least one item';
  end if;

  -- Delete existing items
  delete from bill_items where bill_id = p_bill_id;

  -- Insert recalculated items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_service_id := case when v_item->>'service_id' is not null then (v_item->>'service_id')::uuid else null end;
    v_category_id := (v_item->>'category_id')::uuid;
    v_service_name := v_item->>'service_name';
    v_pricing_type := v_item->>'pricing_type';
    v_unit_rate := (v_item->>'unit_rate')::int;
    v_quantity := (v_item->>'quantity')::int;
    v_min_charge := case when v_item->>'min_charge' is not null then (v_item->>'min_charge')::int else null end;

    if v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;

    if v_pricing_type = 'FIXED' or v_pricing_type = 'PER_UNIT' then
      v_calc_amount := v_unit_rate * v_quantity;
    else
      v_calc_amount := greatest(v_unit_rate * v_quantity, coalesce(v_min_charge, 0));
    end if;

    v_total := v_total + v_calc_amount;

    insert into bill_items (
      bill_id,
      service_id,
      category_id,
      service_name,
      pricing_type,
      quantity,
      unit_rate,
      min_charge,
      amount
    ) values (
      p_bill_id,
      v_service_id,
      v_category_id,
      v_service_name,
      v_pricing_type,
      v_quantity,
      v_unit_rate,
      v_min_charge,
      v_calc_amount
    );
  end loop;

  -- Update bill header
  update bills set
    customer_id = p_customer_id,
    customer_name = case when trim(p_name) = '' then null else trim(p_name) end,
    phone = case when trim(p_phone) = '' then null else trim(p_phone) end,
    payment_method = p_method,
    total = v_total
  where id = p_bill_id;

  select jsonb_build_object(
    'id', b.id,
    'bill_date', b.bill_date,
    'token_no', b.token_no,
    'customer_name', b.customer_name,
    'phone', b.phone,
    'payment_method', b.payment_method,
    'total', b.total
  ) into v_result
  from bills b
  where b.id = p_bill_id;

  return v_result;
end;
$$;

-- 4. Soft Delete Bill
create or replace function soft_delete_bill(p_bill_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update bills set deleted_at = now() where id = p_bill_id;
end;
$$;

-- 5. Deliver Tailoring Order
create or replace function deliver_tailoring_order(
  p_order_id uuid,
  p_method text,
  p_date date
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_tailoring_cat_id uuid;
  v_bill_id uuid;
  v_item record;
  v_is_account boolean;
  v_result jsonb;
begin
  -- Fetch order
  select * into v_order from tailoring_orders where id = p_order_id;
  if not found then
    raise exception 'Tailoring order not found';
  end if;

  if v_order.status = 'delivered' then
    raise exception 'Tailoring order is already delivered';
  end if;

  if p_method not in ('cash', 'upi', 'account') then
    raise exception 'Invalid payment method: %', p_method;
  end if;

  if p_method = 'account' then
    if v_order.customer_id is null then
      raise exception 'Customer must be an account customer to use account payment';
    end if;
    select is_account into v_is_account from customers where id = v_order.customer_id;
    if v_is_account is not true then
      raise exception 'Customer is not registered as an account customer';
    end if;
  end if;

  -- Get tailoring category id
  select id into v_tailoring_cat_id from categories where name = 'Tailoring' limit 1;
  if v_tailoring_cat_id is null then
    raise exception 'Category Tailoring not found';
  end if;

  -- Create bill dated p_date
  insert into bills (
    bill_date,
    token_no,
    customer_id,
    customer_name,
    phone,
    payment_method,
    total,
    tailoring_order_id
  ) values (
    p_date,
    null, -- tailoring orders are named, no token
    v_order.customer_id,
    v_order.customer_name,
    v_order.phone,
    p_method,
    v_order.total,
    p_order_id
  ) returning id into v_bill_id;

  -- Copy tailoring order items to bill items
  for v_item in select * from tailoring_order_items where order_id = p_order_id
  loop
    insert into bill_items (
      bill_id,
      service_id,
      category_id,
      service_name,
      pricing_type,
      quantity,
      unit_rate,
      min_charge,
      amount
    ) values (
      v_bill_id,
      v_item.service_id,
      v_tailoring_cat_id,
      v_item.service_name,
      'FIXED',
      v_item.quantity,
      v_item.unit_rate,
      null,
      v_item.amount
    );
  end loop;

  -- Update tailoring order status
  update tailoring_orders set
    status = 'delivered',
    delivered_at = now()
  where id = p_order_id;

  select jsonb_build_object(
    'order_id', p_order_id,
    'bill_id', v_bill_id,
    'status', 'delivered',
    'delivered_on', p_date,
    'total', v_order.total
  ) into v_result;

  return v_result;
end;
$$;

-- 6. Pay Vendor Order
create or replace function pay_vendor_order(
  p_order_id uuid,
  p_method text,
  p_date date
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_vendor_cat_id uuid;
  v_expense_id uuid;
  v_result jsonb;
begin
  select * into v_order from vendor_orders where id = p_order_id;
  if not found then
    raise exception 'Vendor order not found';
  end if;

  if v_order.status != 'delivered' then
    raise exception 'Vendor order must be in delivered status before paying';
  end if;

  if v_order.quoted_amount is null or v_order.quoted_amount <= 0 then
    raise exception 'Quoted amount must be set and greater than 0';
  end if;

  if p_method not in ('cash', 'upi') then
    raise exception 'Payment method must be cash or upi';
  end if;

  -- Ensure Vendor Order expense category exists
  select id into v_vendor_cat_id from expense_categories where name = 'Vendor Order' limit 1;
  if v_vendor_cat_id is null then
    insert into expense_categories (name) values ('Vendor Order') returning id into v_vendor_cat_id;
  end if;

  -- Update vendor order
  update vendor_orders set
    status = 'paid',
    paid_on = p_date,
    payment_method = p_method
  where id = p_order_id;

  -- Insert expense record
  insert into expenses (
    expense_date,
    category_id,
    amount,
    method,
    note,
    vendor_order_id
  ) values (
    p_date,
    v_vendor_cat_id,
    v_order.quoted_amount,
    p_method,
    concat('Payment for Order #', v_order.order_no),
    p_order_id
  ) returning id into v_expense_id;

  select jsonb_build_object(
    'order_id', p_order_id,
    'expense_id', v_expense_id,
    'status', 'paid',
    'paid_on', p_date,
    'amount', v_order.quoted_amount
  ) into v_result;

  return v_result;
end;
$$;

