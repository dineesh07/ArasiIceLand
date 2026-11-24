const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const pool = new Pool({ connectionString: match[1], ssl: { rejectUnauthorized: false } });

async function run() {
  console.log('1. Adding workspace columns to tables...');
  
  await pool.query(`
    ALTER TABLE bills ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'owner';
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'owner';
    ALTER TABLE tailoring_orders ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'owner';
    ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'owner';
    ALTER TABLE account_payments ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'owner';
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'owner';
    ALTER TABLE daily_token_counters ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'owner';
  `);

  // Update token index on bills to be per-workspace
  await pool.query(`
    DROP INDEX IF EXISTS bills_bill_date_token_no_idx;
    CREATE UNIQUE INDEX IF NOT EXISTS bills_bill_date_token_no_workspace_idx 
      ON bills (bill_date, token_no, workspace) 
      WHERE token_no IS NOT NULL AND deleted_at IS NULL;
  `);

  // Update daily_token_counters primary key to (bill_date, workspace)
  await pool.query(`
    ALTER TABLE daily_token_counters DROP CONSTRAINT IF EXISTS daily_token_counters_pkey;
    ALTER TABLE daily_token_counters ADD CONSTRAINT daily_token_counters_pkey PRIMARY KEY (bill_date, workspace);
  `);

  console.log('2. Restoring backup data for owner workspace...');
  const backup = JSON.parse(fs.readFileSync('scratch/backup_before_kalai.json', 'utf8'));

  // Clear any partial data first
  await pool.query('TRUNCATE TABLE bill_items, bills CASCADE');
  await pool.query('TRUNCATE TABLE account_payments CASCADE');
  await pool.query('TRUNCATE TABLE tailoring_order_items, tailoring_orders CASCADE');
  await pool.query('TRUNCATE TABLE vendor_order_items, vendor_orders CASCADE');
  await pool.query('TRUNCATE TABLE expenses CASCADE');

  // Restore customers
  for (const c of backup.customers || []) {
    await pool.query(`
      INSERT INTO customers (id, name, phone, is_account, active, created_at, workspace)
      VALUES ($1, $2, $3, $4, $5, $6, 'owner')
      ON CONFLICT (id) DO UPDATE SET workspace = 'owner'
    `, [c.id, c.name, c.phone, c.is_account, c.active, c.created_at]);
  }
  console.log(`✓ Restored ${(backup.customers || []).length} customers`);

  // Restore vendor_orders and items
  for (const vo of backup.vendor_orders || []) {
    await pool.query(`
      INSERT INTO vendor_orders (id, order_no, order_date, status, quoted_amount, delivered_on, paid_on, payment_method, note, created_at, workspace)
      OVERRIDING SYSTEM VALUE
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'owner')
      ON CONFLICT (id) DO NOTHING
    `, [vo.id, vo.order_no, vo.order_date, vo.status, vo.quoted_amount, vo.delivered_on, vo.paid_on, vo.payment_method, vo.note, vo.created_at]);
  }
  for (const voi of backup.vendor_order_items || []) {
    await pool.query(`
      INSERT INTO vendor_order_items (id, order_id, product_name, quantity, unit, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [voi.id, voi.order_id, voi.product_name, voi.quantity, voi.unit, voi.created_at]);
  }
  console.log(`✓ Restored ${(backup.vendor_orders || []).length} vendor orders`);

  // Restore expenses
  for (const e of backup.expenses || []) {
    await pool.query(`
      INSERT INTO expenses (id, expense_date, category_id, amount, method, note, vendor_order_id, deleted_at, created_at, workspace)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'owner')
      ON CONFLICT (id) DO NOTHING
    `, [e.id, e.expense_date, e.category_id, e.amount, e.method, e.note, e.vendor_order_id, e.deleted_at, e.created_at]);
  }
  console.log(`✓ Restored ${(backup.expenses || []).length} expenses`);

  // Restore tailoring_orders and items
  for (const t of backup.tailoring_orders || []) {
    await pool.query(`
      INSERT INTO tailoring_orders (id, customer_name, phone, received_on, delivery_date, status, total, note, delivered_at, customer_id, created_at, workspace)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'owner')
      ON CONFLICT (id) DO NOTHING
    `, [t.id, t.customer_name, t.phone, t.received_on, t.delivery_date, t.status, t.total, t.note, t.delivered_at, t.customer_id, t.created_at]);
  }
  for (const ti of backup.tailoring_order_items || []) {
    await pool.query(`
      INSERT INTO tailoring_order_items (id, order_id, service_id, service_name, quantity, unit_rate, amount, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `, [ti.id, ti.order_id, ti.service_id, ti.service_name, ti.quantity, ti.unit_rate, ti.amount, ti.created_at]);
  }
  console.log(`✓ Restored ${(backup.tailoring_orders || []).length} tailoring orders`);

  // Restore bills and items
  for (const b of backup.bills || []) {
    await pool.query(`
      INSERT INTO bills (id, bill_date, token_no, customer_id, customer_name, phone, payment_method, total, tailoring_order_id, deleted_at, created_at, workspace)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'owner')
      ON CONFLICT (id) DO NOTHING
    `, [b.id, b.bill_date, b.token_no, b.customer_id, b.customer_name, b.phone, b.payment_method, b.total, b.tailoring_order_id, b.deleted_at, b.created_at]);
  }
  for (const bi of backup.bill_items || []) {
    await pool.query(`
      INSERT INTO bill_items (id, bill_id, service_id, category_id, service_name, pricing_type, quantity, unit_rate, min_charge, amount, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING
    `, [bi.id, bi.bill_id, bi.service_id, bi.category_id, bi.service_name, bi.pricing_type, bi.quantity, bi.unit_rate, bi.min_charge, bi.amount, bi.created_at]);
  }
  console.log(`✓ Restored ${(backup.bills || []).length} bills & ${(backup.bill_items || []).length} bill items`);

  // Restore account_payments
  for (const ap of backup.account_payments || []) {
    await pool.query(`
      INSERT INTO account_payments (id, customer_id, amount, method, paid_on, note, deleted_at, created_at, workspace)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'owner')
      ON CONFLICT (id) DO NOTHING
    `, [ap.id, ap.customer_id, ap.amount, ap.method, ap.paid_on, ap.note, ap.deleted_at, ap.created_at]);
  }
  console.log(`✓ Restored ${(backup.account_payments || []).length} account payments`);

  // Check counts
  const finalBillsOwner = await pool.query("SELECT count(*) FROM bills WHERE workspace = 'owner'");
  const finalBillsKalai = await pool.query("SELECT count(*) FROM bills WHERE workspace = 'kalai'");
  console.log('Final Bills - Owner:', finalBillsOwner.rows[0].count, 'Kalai:', finalBillsKalai.rows[0].count);

  await pool.end();
}

run().catch(console.error);
