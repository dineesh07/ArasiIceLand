const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env.local
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) {
        process.env.DATABASE_URL = match[1];
      }
    }
  } catch (e) {}
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL missing');
  process.exit(1);
}

function formatServiceName(name, sizeLabel) {
  if (sizeLabel && sizeLabel.trim()) {
    const trimmed = sizeLabel.trim();
    if (name.toLowerCase().endsWith(trimmed.toLowerCase())) {
      return name;
    }
    return `${name} ${trimmed}`;
  }
  return name;
}

async function syncVendorProducts() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to DB. Syncing Arun Ice Creams into vendor_products table...');

  // 1. Fetch all ice cream services
  const res = await client.query(`
    select s.id, s.name, s.size_label, s.active
    from services s
    join categories c on s.category_id = c.id
    where c.name = 'Ice Cream'
    order by s.sort_order
  `);

  console.log(`Found ${res.rows.length} ice cream services.`);

  let inserted = 0;
  let existing = 0;

  for (const s of res.rows) {
    const fullName = formatServiceName(s.name, s.size_label);
    
    // Check if already in vendor_products
    const check = await client.query(
      'select id from vendor_products where lower(name) = lower($1)',
      [fullName]
    );

    if (check.rows.length === 0) {
      await client.query(
        'insert into vendor_products (name, unit, active) values ($1, $2, $3)',
        [fullName, 'box', s.active]
      );
      inserted++;
    } else {
      existing++;
    }
  }

  console.log(`Sync complete: ${inserted} inserted, ${existing} already existed.`);

  const total = await client.query('select count(*) from vendor_products');
  console.log(`Total vendor_products count: ${total.rows[0].count}`);

  await client.end();
}

syncVendorProducts().catch(err => {
  console.error('Error syncing vendor products:', err);
  process.exit(1);
});

