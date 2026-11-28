const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const pool = new Pool({ connectionString: match[1], ssl: { rejectUnauthorized: false } });

async function run() {
  console.log('Adding expense_type column and Personal & Home Expense category...');

  await pool.query(`
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_type text NOT NULL DEFAULT 'shop';
  `);

  await pool.query(`
    INSERT INTO expense_categories (name)
    VALUES ('Personal & Home Expense')
    ON CONFLICT (name) DO NOTHING;
  `);

  // Ensure any existing Personal & Home Expense rows have expense_type = 'personal'
  await pool.query(`
    UPDATE expenses e
    SET expense_type = 'personal'
    FROM expense_categories ec
    WHERE e.category_id = ec.id
      AND lower(ec.name) LIKE '%personal%';
  `);

  const cats = await pool.query('SELECT id, name FROM expense_categories ORDER BY name');
  console.log('Expense Categories:', cats.rows);

  await pool.end();
}

run().catch(console.error);
