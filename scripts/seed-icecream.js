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

const SUBCATEGORIES = [
  { name: 'Bars', sort_order: 1 },
  { name: 'iBar', sort_order: 2 },
  { name: 'i-Cone', sort_order: 3 },
  { name: 'Ice Cream Shake', sort_order: 4 },
  { name: 'Cups', sort_order: 5 },
  { name: 'Tubs', sort_order: 6 },
  { name: 'Specialities', sort_order: 7 },
];

const ICE_CREAM_ITEMS = [
  // BARS (Active: 15, Inactive: 6)
  { subcategory: 'Bars', name: 'Kulfi King', size_label: null, price: 50, active: true },
  { subcategory: 'Bars', name: 'Yummy Bears', size_label: null, price: 30, active: true },
  { subcategory: 'Bars', name: 'Chocobar', size_label: null, price: 30, active: true },
  { subcategory: 'Bars', name: '2-in-1 Mango & Vanilla', size_label: null, price: 35, active: true },
  { subcategory: 'Bars', name: '2-in-1 Strawberry & Blackcurrant', size_label: null, price: 30, active: true },
  { subcategory: 'Bars', name: 'Spiral Mango & Litchi', size_label: null, price: 25, active: true },
  { subcategory: 'Bars', name: 'Spiral Wildberry, Pineapple & Vanilla', size_label: null, price: 25, active: true },
  { subcategory: 'Bars', name: 'Jolly Train', size_label: null, price: 25, active: true },
  { subcategory: 'Bars', name: 'Fun Wheel', size_label: null, price: 30, active: true },
  { subcategory: 'Bars', name: 'Whale', size_label: null, price: 30, active: true },
  { subcategory: 'Bars', name: 'Watermelon', size_label: null, price: 25, active: true },
  { subcategory: 'Bars', name: 'Little Love', size_label: null, price: 25, active: true },
  { subcategory: 'Bars', name: 'Mini Chocobar', size_label: null, price: 20, active: true },
  { subcategory: 'Bars', name: 'Likstick Grape', size_label: null, price: 15, active: true },
  { subcategory: 'Bars', name: 'Likstick Orange', size_label: null, price: 15, active: true },
  // Bars Inactive
  { subcategory: 'Bars', name: 'Trio', size_label: null, price: 25, active: false },
  { subcategory: 'Bars', name: 'Neapolitan', size_label: null, price: 25, active: false },
  { subcategory: 'Bars', name: 'Smiley', size_label: null, price: 25, active: false },
  { subcategory: 'Bars', name: 'Bazooka', size_label: null, price: 15, active: false },
  { subcategory: 'Bars', name: 'Triples', size_label: null, price: 10, active: false },
  { subcategory: 'Bars', name: 'Popitos', size_label: null, price: 5, active: false },

  // iBar (Active: 3, Inactive: 2)
  { subcategory: 'iBar', name: 'Almond Crunch', size_label: null, price: 90, active: true },
  { subcategory: 'iBar', name: 'Belgian Chocolate (iBar mini)', size_label: null, price: 40, active: true },
  { subcategory: 'iBar', name: 'Raspberry Ripple (iBar mini)', size_label: null, price: 40, active: true },
  // iBar Inactive
  { subcategory: 'iBar', name: 'Classic Vanilla', size_label: null, price: 60, active: false },
  { subcategory: 'iBar', name: 'Irish Coffee', size_label: null, price: 35, active: false },

  // i-Cone (Active: 13, Inactive: 1)
  { subcategory: 'i-Cone', name: 'Double Chocolate', size_label: '100 ml', price: 60, active: true },
  { subcategory: 'i-Cone', name: 'Blackcurrant', size_label: '100 ml', price: 60, active: true },
  { subcategory: 'i-Cone', name: 'Butterscotch', size_label: '100 ml', price: 60, active: true },
  { subcategory: 'i-Cone', name: 'Red Velvet', size_label: '100 ml', price: 60, active: true },
  { subcategory: 'i-Cone', name: 'Belgian Chocolate', size_label: '100 ml', price: 60, active: true },
  { subcategory: 'i-Cone', name: 'Strawberry Cheese Cake', size_label: '100 ml', price: 55, active: true },
  { subcategory: 'i-Cone', name: 'Vanilla', size_label: '100 ml', price: 55, active: true },
  { subcategory: 'i-Cone', name: 'Caribbean Almond', size_label: '50 ml', price: 40, active: true },
  { subcategory: 'i-Cone', name: 'Kesar Pista', size_label: '50 ml', price: 40, active: true },
  { subcategory: 'i-Cone', name: 'Raspberry Chocolate Truffle', size_label: '50 ml', price: 40, active: true },
  { subcategory: 'i-Cone', name: 'Cotton Candy', size_label: '50 ml', price: 40, active: true },
  { subcategory: 'i-Cone', name: 'Chocolate', size_label: '50 ml', price: 40, active: true },
  { subcategory: 'i-Cone', name: 'Vanilla', size_label: '50 ml', price: 35, active: true },
  // i-Cone Inactive
  { subcategory: 'i-Cone', name: 'Almond Praline', size_label: '100 ml', price: 50, active: false },

  // Ice Cream Shake (Active: 3, Inactive: 0)
  { subcategory: 'Ice Cream Shake', name: 'Strawberry Shake', size_label: null, price: 30, active: true },
  { subcategory: 'Ice Cream Shake', name: 'Chocolate Shake', size_label: null, price: 30, active: true },
  { subcategory: 'Ice Cream Shake', name: 'Cotton Candy Shake', size_label: null, price: 30, active: true },

  // Cups (Active: 11, Inactive: 0)
  { subcategory: 'Cups', name: 'Chocolate Cup', size_label: '85 ml', price: 35, active: true },
  { subcategory: 'Cups', name: 'Vanilla Cup', size_label: '85 ml', price: 30, active: true },
  { subcategory: 'Cups', name: 'Strawberry Cup', size_label: '60 ml', price: 20, active: true },
  { subcategory: 'Cups', name: 'Vanilla Cup', size_label: '60 ml', price: 15, active: true },
  { subcategory: 'Cups', name: 'Mango Cup', size_label: '125 ml', price: 55, active: true },
  { subcategory: 'Cups', name: 'Blackcurrant Cup', size_label: '125 ml', price: 55, active: true },
  { subcategory: 'Cups', name: 'Kulfi Maharaj Cup', size_label: '125 ml', price: 55, active: true },
  { subcategory: 'Cups', name: 'Italian Delight Cup', size_label: '125 ml', price: 55, active: true },
  { subcategory: 'Cups', name: 'Butterscotch Cup', size_label: '125 ml', price: 45, active: true },
  { subcategory: 'Cups', name: 'Kesar Pista Cup', size_label: '125 ml', price: 45, active: true },
  { subcategory: 'Cups', name: 'Vanilla Cup', size_label: '125 ml', price: 45, active: true },

  // Tubs (Active: 25, Inactive: 1)
  { subcategory: 'Tubs', name: 'Almond Crisp', size_label: '1000 ml', price: 320, active: true },
  { subcategory: 'Tubs', name: 'Dark Chocolate', size_label: '1000 ml', price: 320, active: true },
  { subcategory: 'Tubs', name: 'Italian Delight', size_label: '1000 ml', price: 320, active: true },
  { subcategory: 'Tubs', name: 'Butterscotch', size_label: '1000 ml', price: 300, active: true },
  { subcategory: 'Tubs', name: 'Brownie Banoffee', size_label: '1000 ml', price: 300, active: true },
  { subcategory: 'Tubs', name: 'Sweet Butter', size_label: '1000 ml', price: 300, active: true },
  { subcategory: 'Tubs', name: 'Caramel Peanut Butter', size_label: '1000 ml', price: 300, active: true },
  { subcategory: 'Tubs', name: 'Strawberry Blast', size_label: '1000 ml', price: 290, active: true },
  { subcategory: 'Tubs', name: 'Blueberry & Cheese Duet', size_label: '1000 ml', price: 290, active: true },
  { subcategory: 'Tubs', name: 'Red Velvet & Salted Caramel Duet', size_label: '1000 ml', price: 290, active: true },
  { subcategory: 'Tubs', name: 'Vanilla', size_label: '1000 ml', price: 260, active: true },
  { subcategory: 'Tubs', name: 'Raj Bhog', size_label: '500 ml', price: 190, active: true },
  { subcategory: 'Tubs', name: 'Pista', size_label: '500 ml', price: 180, active: true },
  { subcategory: 'Tubs', name: 'Chocolate', size_label: '500 ml', price: 180, active: true },
  { subcategory: 'Tubs', name: 'Gajar Ka Halwa', size_label: '500 ml', price: 170, active: true },
  { subcategory: 'Tubs', name: 'Mango', size_label: '500 ml', price: 170, active: true },
  { subcategory: 'Tubs', name: 'Butterscotch & Chocolate', size_label: '500 ml', price: 170, active: true },
  { subcategory: 'Tubs', name: 'Vanilla & Blackcurrant Duet', size_label: '500 ml', price: 170, active: true },
  { subcategory: 'Tubs', name: 'Butterscotch', size_label: '500 ml', price: 160, active: true },
  { subcategory: 'Tubs', name: 'Strawberry', size_label: '500 ml', price: 150, active: true },
  { subcategory: 'Tubs', name: 'Vanilla', size_label: '500 ml', price: 150, active: true },
  { subcategory: 'Tubs', name: 'Coffee', size_label: '250 ml', price: 95, active: true },
  { subcategory: 'Tubs', name: 'Butterscotch', size_label: '250 ml', price: 95, active: true },
  { subcategory: 'Tubs', name: 'Jackfruit', size_label: '250 ml', price: 95, active: true },
  { subcategory: 'Tubs', name: 'Vanilla', size_label: '250 ml', price: 85, active: true },
  // Tubs Inactive
  { subcategory: 'Tubs', name: 'Musk Melon', size_label: '250 ml', price: 90, active: false },

  // Specialities (Active: 9, Inactive: 5)
  { subcategory: 'Specialities', name: 'Bites Vanilla', size_label: null, price: 10, active: true },
  { subcategory: 'Specialities', name: 'Bites Choco Toffee', size_label: null, price: 5, active: true },
  { subcategory: 'Specialities', name: 'Bites Cotton Candy', size_label: null, price: 5, active: true },
  { subcategory: 'Specialities', name: 'Ice Cream Sandwich Cookie & Cream', size_label: null, price: 25, active: true },
  { subcategory: 'Specialities', name: 'Mini Ball Chocolate', size_label: null, price: 45, active: true },
  { subcategory: 'Specialities', name: 'Mini Ball Vanilla', size_label: null, price: 45, active: true },
  { subcategory: 'Specialities', name: 'Cake Slice', size_label: null, price: 70, active: true },
  { subcategory: 'Specialities', name: 'Cassata Slice', size_label: null, price: 70, active: true },
  { subcategory: 'Specialities', name: 'Pushup', size_label: null, price: 40, active: true },
  // Specialities Inactive
  { subcategory: 'Specialities', name: 'Bites Raspberry', size_label: null, price: 10, active: false },
  { subcategory: 'Specialities', name: 'Bites Red Velvet', size_label: null, price: 10, active: false },
  { subcategory: 'Specialities', name: 'Bites Lychee', size_label: null, price: 10, active: false },
  { subcategory: 'Specialities', name: 'Ice Cream Sandwich Butterscotch', size_label: null, price: 10, active: false },
  { subcategory: 'Specialities', name: 'Cassata Ball', size_label: null, price: 600, active: false },
];

async function run() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected successfully!');

  // 1. Get or create Ice Cream category
  let catRes = await client.query("SELECT id FROM categories WHERE name = 'Ice Cream'");
  let categoryId;
  if (catRes.rows.length === 0) {
    const insertCat = await client.query("INSERT INTO categories (name, sort_order) VALUES ('Ice Cream', 2) RETURNING id");
    categoryId = insertCat.rows[0].id;
  } else {
    categoryId = catRes.rows[0].id;
  }
  console.log(`Ice Cream Category ID: ${categoryId}`);

  // 2. Deactivate previous dummy ice cream services (those without subcategory_id)
  await client.query("UPDATE services SET active = false WHERE category_id = $1 AND subcategory_id IS NULL", [categoryId]);
  console.log('Deactivated legacy dummy ice creams (if any).');

  // 3. Seed subcategories idempotently
  const subcatMap = {};
  for (const sub of SUBCATEGORIES) {
    const res = await client.query(
      `INSERT INTO subcategories (category_id, name, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (category_id, name) DO UPDATE SET sort_order = excluded.sort_order
       RETURNING id, name`,
      [categoryId, sub.name, sub.sort_order]
    );
    subcatMap[sub.name] = res.rows[0].id;
  }
  console.log('Subcategories ready:', Object.keys(subcatMap));

  // 4. Seed Ice Cream services idempotently
  let activeCount = 0;
  let inactiveCount = 0;
  let sortOrder = 1;

  for (const item of ICE_CREAM_ITEMS) {
    const subcatId = subcatMap[item.subcategory];
    if (!subcatId) {
      throw new Error(`Unknown subcategory: ${item.subcategory}`);
    }

    // Check if service already exists with same category, subcategory, name and size_label
    const checkQuery = item.size_label !== null
      ? "SELECT id FROM services WHERE category_id = $1 AND subcategory_id = $2 AND name = $3 AND size_label = $4"
      : "SELECT id FROM services WHERE category_id = $1 AND subcategory_id = $2 AND name = $3 AND size_label IS NULL";
    
    const checkParams = item.size_label !== null
      ? [categoryId, subcatId, item.name, item.size_label]
      : [categoryId, subcatId, item.name];

    const existing = await client.query(checkQuery, checkParams);

    if (existing.rows.length > 0) {
      // Update price, active status, unit_label, sort_order
      await client.query(
        `UPDATE services
         SET rate = $1, active = $2, pricing_type = 'FIXED', unit_label = 'piece', min_charge = null, sort_order = $3
         WHERE id = $4`,
        [item.price, item.active, sortOrder, existing.rows[0].id]
      );
    } else {
      // Insert new service
      await client.query(
        `INSERT INTO services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, min_charge, active, sort_order)
         VALUES ($1, $2, $3, $4, 'FIXED', 'piece', $5, null, $6, $7)`,
        [categoryId, subcatId, item.name, item.size_label, item.price, item.active, sortOrder]
      );
    }

    if (item.active) activeCount++;
    else inactiveCount++;
    sortOrder++;
  }

  console.log(`\n=============================================`);
  console.log(`✅ ARUN ICE CREAMS SEEDED SUCCESSFULLY!`);
  console.log(`Total services:   ${activeCount + inactiveCount}`);
  console.log(`  Active items:   ${activeCount}`);
  console.log(`  Inactive items: ${inactiveCount}`);
  console.log(`=============================================\n`);

  await client.end();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

