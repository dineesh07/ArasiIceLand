const fs = require('fs');
const { Pool } = require('pg');

const envFile = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  }
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connected to DB...');
  const servicesRes = await pool.query(`
    select s.id, s.name, s.category_id, c.name as category_name, s.subcategory_id, s.pricing_type, s.rate, s.min_charge
    from services s
    join categories c on c.id = s.category_id
    where s.active = true
  `);
  console.log(`Found ${servicesRes.rows.length} active services.`);
  
  const categoriesRes = await pool.query(`select id, name from categories`);
  console.log('Categories:', categoriesRes.rows);

  await pool.end();
}

run().catch(console.error);
