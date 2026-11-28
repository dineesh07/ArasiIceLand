const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const pool = new Pool({ connectionString: match[1], ssl: { rejectUnauthorized: false } });

async function run() {
  console.log('Updating create_bill and update_bill to support custom item amounts...');

  await pool.query(`
    CREATE OR REPLACE FUNCTION create_bill(
      p_date date,
      p_customer_id uuid,
      p_name text,
      p_phone text,
      p_method text,
      p_items jsonb,
      p_workspace text DEFAULT 'owner'
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
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
    BEGIN
      IF p_method NOT IN ('cash', 'upi', 'account') THEN
        RAISE EXCEPTION 'Invalid payment method: %', p_method;
      END IF;

      IF p_method = 'account' THEN
        IF p_customer_id IS NULL THEN
          RAISE EXCEPTION 'Account payment requires a selected customer';
        END IF;
        SELECT is_account INTO v_is_account FROM customers WHERE id = p_customer_id;
        IF v_is_account IS NOT true THEN
          RAISE EXCEPTION 'Customer is not configured as an account customer';
        END IF;
      END IF;

      IF (p_name IS NULL OR trim(p_name) = '') AND p_customer_id IS NULL THEN
        v_token_no := next_token(p_date, COALESCE(p_workspace, 'owner'));
      END IF;

      IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Bill must have at least one item';
      END IF;

      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
        v_pricing_type := v_item->>'pricing_type';
        v_unit_rate := (v_item->>'unit_rate')::int;
        v_quantity := (v_item->>'quantity')::int;
        v_min_charge := CASE WHEN v_item->>'min_charge' IS NOT NULL THEN (v_item->>'min_charge')::int ELSE null END;

        IF v_quantity <= 0 THEN
          RAISE EXCEPTION 'Quantity must be greater than zero';
        END IF;

        IF v_item->>'amount' IS NOT NULL AND (v_item->>'amount')::int >= 0 THEN
          v_calc_amount := (v_item->>'amount')::int;
        ELSIF v_pricing_type = 'FIXED' OR v_pricing_type = 'PER_UNIT' THEN
          v_calc_amount := v_unit_rate * v_quantity;
        ELSIF v_pricing_type = 'PER_UNIT_MIN' THEN
          v_calc_amount := greatest(v_unit_rate * v_quantity, COALESCE(v_min_charge, 0));
        ELSE
          RAISE EXCEPTION 'Unknown pricing type: %', v_pricing_type;
        END IF;

        v_total := v_total + v_calc_amount;
      END LOOP;

      INSERT INTO bills (
        bill_date,
        token_no,
        customer_id,
        customer_name,
        phone,
        payment_method,
        total,
        workspace
      ) VALUES (
        p_date,
        v_token_no,
        p_customer_id,
        CASE WHEN trim(p_name) = '' THEN null ELSE trim(p_name) END,
        CASE WHEN trim(p_phone) = '' THEN null ELSE trim(p_phone) END,
        p_method,
        v_total,
        COALESCE(p_workspace, 'owner')
      ) RETURNING id INTO v_bill_id;

      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
        v_service_id := CASE WHEN v_item->>'service_id' IS NOT NULL AND v_item->>'service_id' != '' THEN (v_item->>'service_id')::uuid ELSE null END;
        v_category_id := (v_item->>'category_id')::uuid;
        v_service_name := v_item->>'service_name';
        v_pricing_type := v_item->>'pricing_type';
        v_unit_rate := (v_item->>'unit_rate')::int;
        v_quantity := (v_item->>'quantity')::int;
        v_min_charge := CASE WHEN v_item->>'min_charge' IS NOT NULL THEN (v_item->>'min_charge')::int ELSE null END;

        IF v_item->>'amount' IS NOT NULL AND (v_item->>'amount')::int >= 0 THEN
          v_calc_amount := (v_item->>'amount')::int;
        ELSIF v_pricing_type = 'FIXED' OR v_pricing_type = 'PER_UNIT' THEN
          v_calc_amount := v_unit_rate * v_quantity;
        ELSIF v_pricing_type = 'PER_UNIT_MIN' THEN
          v_calc_amount := greatest(v_unit_rate * v_quantity, COALESCE(v_min_charge, 0));
        END IF;

        INSERT INTO bill_items (
          bill_id,
          service_id,
          category_id,
          service_name,
          pricing_type,
          quantity,
          unit_rate,
          min_charge,
          amount
        ) VALUES (
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
      END LOOP;

      SELECT json_build_object(
        'id', b.id,
        'bill_date', b.bill_date,
        'token_no', b.token_no,
        'customer_id', b.customer_id,
        'customer_name', b.customer_name,
        'phone', b.phone,
        'payment_method', b.payment_method,
        'total', b.total,
        'workspace', b.workspace,
        'created_at', b.created_at
      ) INTO v_result
      FROM bills b
      WHERE b.id = v_bill_id;

      RETURN v_result;
    END;
    $$;

    CREATE OR REPLACE FUNCTION update_bill(
      p_bill_id uuid,
      p_customer_id uuid,
      p_name text,
      p_phone text,
      p_method text,
      p_items jsonb
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
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
    BEGIN
      IF p_method NOT IN ('cash', 'upi', 'account') THEN
        RAISE EXCEPTION 'Invalid payment method: %', p_method;
      END IF;

      IF p_method = 'account' THEN
        IF p_customer_id IS NULL THEN
          RAISE EXCEPTION 'Account payment requires a selected customer';
        END IF;
        SELECT is_account INTO v_is_account FROM customers WHERE id = p_customer_id;
        IF v_is_account IS NOT true THEN
          RAISE EXCEPTION 'Customer is not configured as an account customer';
        END IF;
      END IF;

      IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Bill must have at least one item';
      END IF;

      DELETE FROM bill_items WHERE bill_id = p_bill_id;

      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
        v_service_id := CASE WHEN v_item->>'service_id' IS NOT NULL AND v_item->>'service_id' != '' THEN (v_item->>'service_id')::uuid ELSE null END;
        v_category_id := (v_item->>'category_id')::uuid;
        v_service_name := v_item->>'service_name';
        v_pricing_type := v_item->>'pricing_type';
        v_unit_rate := (v_item->>'unit_rate')::int;
        v_quantity := (v_item->>'quantity')::int;
        v_min_charge := CASE WHEN v_item->>'min_charge' IS NOT NULL THEN (v_item->>'min_charge')::int ELSE null END;

        IF v_quantity <= 0 THEN
          RAISE EXCEPTION 'Quantity must be greater than zero';
        END IF;

        IF v_item->>'amount' IS NOT NULL AND (v_item->>'amount')::int >= 0 THEN
          v_calc_amount := (v_item->>'amount')::int;
        ELSIF v_pricing_type = 'FIXED' OR v_pricing_type = 'PER_UNIT' THEN
          v_calc_amount := v_unit_rate * v_quantity;
        ELSIF v_pricing_type = 'PER_UNIT_MIN' THEN
          v_calc_amount := greatest(v_unit_rate * v_quantity, COALESCE(v_min_charge, 0));
        ELSE
          RAISE EXCEPTION 'Unknown pricing type: %', v_pricing_type;
        END IF;

        v_total := v_total + v_calc_amount;

        INSERT INTO bill_items (
          bill_id, service_id, category_id, service_name, pricing_type, quantity, unit_rate, min_charge, amount
        ) VALUES (
          p_bill_id, v_service_id, v_category_id, v_service_name, v_pricing_type, v_quantity, v_unit_rate, v_min_charge, v_calc_amount
        );
      END LOOP;

      UPDATE bills SET
        customer_id = p_customer_id,
        customer_name = CASE WHEN trim(p_name) = '' THEN null ELSE trim(p_name) END,
        phone = CASE WHEN trim(p_phone) = '' THEN null ELSE trim(p_phone) END,
        payment_method = p_method,
        total = v_total
      WHERE id = p_bill_id;

      SELECT jsonb_build_object(
        'id', b.id,
        'bill_date', b.bill_date,
        'token_no', b.token_no,
        'customer_name', b.customer_name,
        'phone', b.phone,
        'payment_method', b.payment_method,
        'total', b.total
      ) INTO v_result
      FROM bills b
      WHERE b.id = p_bill_id;

      RETURN v_result;
    END;
    $$;
  `);

  console.log('✓ Successfully updated create_bill and update_bill!');
  await pool.end();
}

run().catch(console.error);
