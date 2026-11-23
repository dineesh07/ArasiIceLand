const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env.local if not already defined
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
  } catch (e) {
    // Ignore error
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

async function run() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected successfully!');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20261123000001_subcategories_and_sizes.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running 20261123000001_subcategories_and_sizes.sql...');
  await client.query(migrationSql);

  console.log('Migration applied successfully!');
  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

