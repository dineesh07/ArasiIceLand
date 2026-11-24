const fs = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const env = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of env.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
  }
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log('Connecting to database...');

  // 1. BACKUP CURRENT DATA
  const backup = {};
  const tablesToBackup = [
    'bills', 'bill_items', 'account_payments', 'tailoring_orders',
    'tailoring_order_items', 'expenses', 'vendor_orders', 'vendor_order_items',
    'services', 'categories', 'customers'
  ];
  for (const t of tablesToBackup) {
    const res = await pool.query(`SELECT * FROM "${t}"`);
    backup[t] = res.rows;
  }
  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');
  fs.writeFileSync('scratch/backup_before_kalai.json', JSON.stringify(backup, null, 2));
  console.log('✓ Backup saved to scratch/backup_before_kalai.json');

  // 2. CLEAR TRANSACTIONAL DATA
  console.log('Clearing all transactional bills, orders, expenses, payments...');
  await pool.query('TRUNCATE TABLE bill_items, bills CASCADE');
  await pool.query('TRUNCATE TABLE account_payments CASCADE');
  await pool.query('TRUNCATE TABLE tailoring_order_items, tailoring_orders CASCADE');
  await pool.query('TRUNCATE TABLE vendor_order_items, vendor_orders CASCADE');
  await pool.query('TRUNCATE TABLE expenses CASCADE');
  await pool.query('TRUNCATE TABLE daily_token_counters CASCADE');
  console.log('✓ All sales bills, orders, expenses, and payments cleared.');

  // 3. REMOVE NON-ICE CREAM SERVICES AND CATEGORIES
  console.log('Removing non-ice cream price list services and categories...');
  const iceCreamCatRes = await pool.query("SELECT id FROM categories WHERE name = 'Ice Cream'");
  const iceCreamCatId = iceCreamCatRes.rows[0]?.id;

  if (iceCreamCatId) {
    const delServ = await pool.query('DELETE FROM services WHERE category_id != $1', [iceCreamCatId]);
    console.log(`✓ Deleted ${delServ.rowCount} non-ice cream services.`);

    const delCats = await pool.query("DELETE FROM categories WHERE name != 'Ice Cream'");
    console.log(`✓ Deleted ${delCats.rowCount} non-ice cream categories (Internet Centre & Tailoring).`);
  }

  // 4. USER SETUP: username: kalai, password: Arasi@123
  console.log('Setting up user kalai...');
  await pool.query('ALTER TABLE app_users ADD COLUMN IF NOT EXISTS username text');

  const passwordHash = await bcrypt.hash('Arasi@123', 10);

  // Check if kalai already exists
  const existingUser = await pool.query(
    "SELECT id FROM app_users WHERE lower(username) = 'kalai' OR lower(email) = 'kalai@arasi.com' OR lower(name) = 'kalai'"
  );

  if (existingUser.rows.length > 0) {
    await pool.query(
      `UPDATE app_users 
       SET username = 'kalai', email = 'kalai@arasi.com', name = 'kalai', password_hash = $1, role = 'owner'
       WHERE id = $2`,
      [passwordHash, existingUser.rows[0].id]
    );
    console.log('✓ Updated existing user to kalai with password Arasi@123');
  } else {
    await pool.query(
      `INSERT INTO app_users (id, username, email, name, role, password_hash)
       VALUES (gen_random_uuid(), 'kalai', 'kalai@arasi.com', 'kalai', 'owner', $1)`,
      [passwordHash]
    );
    console.log('✓ Created new user kalai with password Arasi@123');
  }

  // 5. VERIFY FINAL DATABASE STATE
  const finalUsers = await pool.query('SELECT id, username, email, name, role FROM app_users');
  console.log('Final Users:', finalUsers.rows);

  const finalCats = await pool.query('SELECT * FROM categories');
  console.log('Final Categories:', finalCats.rows);

  const finalServs = await pool.query('SELECT count(*) FROM services');
  console.log('Final Services Count (Ice Creams only):', finalServs.rows[0].count);

  const finalBills = await pool.query('SELECT count(*) FROM bills');
  console.log('Final Bills Count:', finalBills.rows[0].count);

  await pool.end();
}

main().catch(err => {
  console.error('Error running setup:', err);
  pool.end();
  process.exit(1);
});
