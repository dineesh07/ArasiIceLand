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
  console.log('Restoring Internet Centre and Tailoring categories & services...');

  const backup = JSON.parse(fs.readFileSync('scratch/backup_before_kalai.json', 'utf8'));

  // 1. Restore Categories: Internet Centre & Tailoring
  for (const cat of backup.categories) {
    await pool.query(`
      INSERT INTO categories (id, name, sort_order, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        sort_order = EXCLUDED.sort_order
    `, [cat.id, cat.name, cat.sort_order, cat.created_at || new Date()]);
  }
  console.log('✓ Categories restored: Internet Centre, Ice Cream, Tailoring');

  // 2. Restore Services for Internet Centre & Tailoring
  const nonIceServices = backup.services.filter(s => s.category_id !== 'd38e4e94-9077-48f4-ab9b-6d3b8cc4a6dc');
  for (const s of nonIceServices) {
    await pool.query(`
      INSERT INTO services (
        id, category_id, subcategory_id, size_label, name, active, 
        pricing_type, unit_label, rate, min_charge, sort_order, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category_id = EXCLUDED.category_id,
        rate = EXCLUDED.rate,
        pricing_type = EXCLUDED.pricing_type,
        active = true
    `, [
      s.id, s.category_id, s.subcategory_id || null, s.size_label || null,
      s.name, true, s.pricing_type, s.unit_label || null,
      s.rate, s.min_charge || null, s.sort_order || 0, s.created_at || new Date()
    ]);
  }
  console.log(`✓ Restored ${nonIceServices.length} Internet Centre and Tailoring services`);

  // 3. User Setup for "arasi" login as well:
  // Set up both 'arasi' and 'kalai' with password 'Arasi@123'
  const passHash = await bcrypt.hash('Arasi@123', 10);
  
  // Update or insert 'arasi'
  await pool.query(`
    INSERT INTO app_users (id, username, email, name, role, password_hash)
    VALUES (gen_random_uuid(), 'arasi', 'arasi@shop.com', 'arasi', 'owner', $1)
    ON CONFLICT (email) DO UPDATE SET
      username = 'arasi',
      name = 'arasi',
      password_hash = $1
  `, [passHash]);

  // Also ensure owner@shop.com has username 'arasi' and password 'Arasi@123'
  await pool.query(`
    UPDATE app_users 
    SET username = 'arasi', password_hash = $1 
    WHERE email = 'owner@shop.com'
  `, [passHash]);

  // Ensure kalai has username 'kalai' and password 'Arasi@123'
  await pool.query(`
    UPDATE app_users 
    SET password_hash = $1 
    WHERE username = 'kalai' OR email = 'kalai@arasi.com'
  `, [passHash]);

  console.log('✓ Users configured: "arasi" and "kalai" with password "Arasi@123"');

  // Verify
  const cats = await pool.query('SELECT id, name, sort_order FROM categories ORDER BY sort_order');
  console.log('Current Categories:', cats.rows);

  const servCount = await pool.query(`
    SELECT c.name, count(s.id) 
    FROM categories c 
    LEFT JOIN services s ON s.category_id = c.id 
    GROUP BY c.name
  `);
  console.log('Services by category:', servCount.rows);

  const users = await pool.query('SELECT username, email, name, role FROM app_users');
  console.log('Active Users:', users.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
