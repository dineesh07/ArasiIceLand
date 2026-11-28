const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const pool = new Pool({ connectionString: match[1], ssl: { rejectUnauthorized: false } });

async function cleanKalai() {
  console.log('Cleaning all transactional entries for workspace = "kalai"...');

  const delBillItems = await pool.query(`
    DELETE FROM bill_items
    WHERE bill_id IN (SELECT id FROM bills WHERE workspace = 'kalai')
  `);
  const delBills = await pool.query(`DELETE FROM bills WHERE workspace = 'kalai'`);
  const delPayments = await pool.query(`DELETE FROM account_payments WHERE workspace = 'kalai'`);
  const delTailorItems = await pool.query(`
    DELETE FROM tailoring_order_items
    WHERE order_id IN (SELECT id FROM tailoring_orders WHERE workspace = 'kalai')
  `);
  const delTailor = await pool.query(`DELETE FROM tailoring_orders WHERE workspace = 'kalai'`);
  const delExpenses = await pool.query(`DELETE FROM expenses WHERE workspace = 'kalai'`);
  const delVendorItems = await pool.query(`
    DELETE FROM vendor_order_items
    WHERE order_id IN (SELECT id FROM vendor_orders WHERE workspace = 'kalai')
  `);
  const delVendor = await pool.query(`DELETE FROM vendor_orders WHERE workspace = 'kalai'`);
  const delCustomers = await pool.query(`DELETE FROM customers WHERE workspace = 'kalai'`);
  const delTokens = await pool.query(`DELETE FROM daily_token_counters WHERE workspace = 'kalai'`);

  console.log('Deleted from kalai:', {
    bill_items: delBillItems.rowCount,
    bills: delBills.rowCount,
    account_payments: delPayments.rowCount,
    tailoring_order_items: delTailorItems.rowCount,
    tailoring_orders: delTailor.rowCount,
    expenses: delExpenses.rowCount,
    vendor_order_items: delVendorItems.rowCount,
    vendor_orders: delVendor.rowCount,
    customers: delCustomers.rowCount,
    daily_token_counters: delTokens.rowCount,
  });

  // Verify final counts for both workspaces
  const verify = async (ws) => {
    const b = await pool.query('SELECT count(*) FROM bills WHERE workspace = $1', [ws]);
    const e = await pool.query('SELECT count(*) FROM expenses WHERE workspace = $1', [ws]);
    const t = await pool.query('SELECT count(*) FROM tailoring_orders WHERE workspace = $1', [ws]);
    const v = await pool.query('SELECT count(*) FROM vendor_orders WHERE workspace = $1', [ws]);
    const c = await pool.query('SELECT count(*) FROM customers WHERE workspace = $1', [ws]);
    return {
      bills: b.rows[0].count,
      expenses: e.rows[0].count,
      tailoring_orders: t.rows[0].count,
      vendor_orders: v.rows[0].count,
      customers: c.rows[0].count,
    };
  };

  console.log('Final kalai counts:', await verify('kalai'));
  console.log('Final owner counts (preserved):', await verify('owner'));

  await pool.end();
}

cleanKalai().catch((err) => {
  console.error(err);
  process.exit(1);
});
