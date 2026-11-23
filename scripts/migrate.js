const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
  console.log('Connecting to Neon Database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Neon successfully!');

  // 1. Create app_users table for owner auth
  console.log('Creating app_users table...');
  await client.query(`
    create extension if not exists "pgcrypto";
    create table if not exists app_users (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      password_hash text not null,
      name text not null default 'Owner',
      role text not null default 'owner',
      created_at timestamptz default now()
    );
  `);

  // 2. Run initial schema migration
  console.log('Running 20261122000001_initial_schema.sql...');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261122000001_initial_schema.sql'), 'utf8');
  await client.query(schemaSql);

  // 3. Run functions & RPC migration
  console.log('Running 20261122000003_functions_and_rpc.sql...');
  const functionsSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261122000003_functions_and_rpc.sql'), 'utf8');
  await client.query(functionsSql);

  // 4. Run report views & queries migration
  console.log('Running 20261122000004_report_views.sql...');
  const reportsSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261122000004_report_views.sql'), 'utf8');
  await client.query(reportsSql);

  // 5. Run seed.sql
  console.log('Running seed.sql...');
  const seedSql = fs.readFileSync(path.join(__dirname, '../supabase/seed.sql'), 'utf8');
  await client.query(seedSql);

  // 6. Create owner user
  const email = 'owner@shop.com';
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await client.query(`
    insert into app_users (email, password_hash, name, role)
    values ($1, $2, 'Shop Owner', 'owner')
    on conflict (email) do update set password_hash = excluded.password_hash;
  `, [email, passwordHash]);

  console.log('\n=============================================');
  console.log('✅ NEON DATABASE MIGRATIONS COMPLETED!');
  console.log('=============================================');
  console.log('Owner Account Ready:');
  console.log('  Email:    owner@shop.com');
  console.log('  Password: password123');
  console.log('=============================================\n');

  // Verify tables
  const res = await client.query(`
    select table_name from information_schema.tables 
    where table_schema = 'public' order by table_name;
  `);
  console.log('Tables in database:');
  console.log(res.rows.map(r => r.table_name).join(', '));

  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

