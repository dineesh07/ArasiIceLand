const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Read DATABASE_URL from .env.local
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    for (const line of envFile.split('\n')) {
      if (line.startsWith('DATABASE_URL=')) {
        dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
        break;
      }
    }
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Helper to format Date as YYYY-MM-DD
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick random item from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('--- Generating 2 Months of Mock Sales Data (Oct 2026 - Nov 2026) ---');

  // 1. Fetch categories
  const catRes = await pool.query('SELECT id, name FROM categories');
  const catMap = {};
  catRes.rows.forEach(r => { catMap[r.name] = r.id; });

  const internetCatId = catMap['Internet Centre'];
  const iceCreamCatId = catMap['Ice Cream'];
  const tailoringCatId = catMap['Tailoring'];

  // 2. Fetch all active services
  const srvRes = await pool.query(`
    SELECT id, name, category_id, subcategory_id, pricing_type, rate, min_charge
    FROM services
    WHERE active = true
  `);
  
  const iceCreamServices = srvRes.rows.filter(s => s.category_id === iceCreamCatId);
  const internetServices = srvRes.rows.filter(s => s.category_id === internetCatId);
  const tailoringServices = srvRes.rows.filter(s => s.category_id === tailoringCatId);

  console.log(`Loaded services: ${iceCreamServices.length} ice creams, ${internetServices.length} internet services, ${tailoringServices.length} tailoring services.`);

  // 3. Ensure some regular customers exist
  let custRes = await pool.query('SELECT id, name, phone, is_account FROM customers');
  if (custRes.rows.length === 0) {
    console.log('Creating sample customers...');
    await pool.query(`
      INSERT INTO customers (name, phone, is_account, active) VALUES
      ('Ramesh Kumar', '9840112233', true, true),
      ('Meenakshi Sundaram', '9443221100', true, true),
      ('Kavitha Rajan', '9884556677', true, true),
      ('Anand Natarajan', '9940123456', false, true),
      ('Priya Murugan', '9789012345', false, true),
      ('Suresh Babu', '9841234567', true, true)
    `);
    custRes = await pool.query('SELECT id, name, phone, is_account FROM customers');
  }

  const customers = custRes.rows;
  const accountCustomers = customers.filter(c => c.is_account);

  // 4. Fetch expense categories
  const expCatRes = await pool.query('SELECT id, name FROM expense_categories');
  const expCategories = expCatRes.rows;

  // 5. Generate dates: 2026-10-01 to 2026-11-24
  const startDate = new Date(2026, 9, 1); // Oct 1, 2026
  const endDate = new Date(2026, 10, 24);  // Nov 24, 2026

  let totalBillsCreated = 0;
  let totalSalesAmount = 0;
  let totalExpensesCreated = 0;

  // Weighted popular ice creams so rankings are realistic & recognizable
  // (e.g. Vanilla Cup, Choco Bar, Chocolate Cone, Mango Cup sell the most)
  const popularIceCreamNames = [
    'Vanilla Cup',
    'Chocolate Cup',
    'Mango Cup',
    'Strawberry Cup',
    'Butterscotch Cup',
    'Chocolate Cone',
    'Butterscotch Cone',
    'Choco Bar',
    'Spiral Mango & Litchi',
    'Kulfi Maharaj',
    'Cassatta',
    'Sweet Butter'
  ];

  const popularIceCreams = iceCreamServices.filter(s =>
    popularIceCreamNames.some(name => s.name.toLowerCase().includes(name.toLowerCase()))
  );

  const regularIceCreams = popularIceCreams.length > 0 ? popularIceCreams : iceCreamServices;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    // Number of bills: 4-8 on weekdays, 6-12 on weekends
    const billCount = isWeekend ? randInt(6, 12) : randInt(4, 8);

    for (let b = 0; b < billCount; b++) {
      // Determine customer: 60% walk-in anonymous, 25% named walk-in, 15% account customer
      const custRoll = Math.random();
      let customerId = null;
      let customerName = null;
      let phone = null;
      let paymentMethod = Math.random() < 0.58 ? 'cash' : 'upi';

      if (custRoll > 0.85 && accountCustomers.length > 0) {
        const acct = pick(accountCustomers);
        customerId = acct.id;
        customerName = acct.name;
        phone = acct.phone;
        // 40% chance to put on account, 60% cash/upi
        if (Math.random() < 0.40) {
          paymentMethod = 'account';
        }
      } else if (custRoll > 0.60) {
        const regular = pick(customers);
        customerId = regular.id;
        customerName = regular.name;
        phone = regular.phone;
      }

      // Generate 1 to 3 items per bill
      const itemCount = randInt(1, 3);
      const items = [];

      for (let i = 0; i < itemCount; i++) {
        // Roll category: 55% ice cream, 35% internet, 10% tailoring
        const typeRoll = Math.random();
        let srv;

        if (typeRoll < 0.55 && regularIceCreams.length > 0) {
          srv = pick(regularIceCreams);
        } else if (typeRoll < 0.90 && internetServices.length > 0) {
          srv = pick(internetServices);
        } else if (tailoringServices.length > 0) {
          srv = pick(tailoringServices);
        } else {
          srv = pick(srvRes.rows);
        }

        const qty = srv.category_id === iceCreamCatId
          ? randInt(1, 4) // 1 to 4 ice creams
          : srv.pricing_type === 'PER_UNIT_MIN' || srv.pricing_type === 'PER_UNIT'
          ? randInt(1, 10) // 1 to 10 xerox / printouts
          : 1;

        items.push({
          service_id: srv.id,
          category_id: srv.category_id,
          service_name: srv.name,
          pricing_type: srv.pricing_type,
          quantity: qty,
          unit_rate: Number(srv.rate),
          min_charge: srv.min_charge ? Number(srv.min_charge) : null,
        });
      }

      // Insert bill using atomic create_bill function
      try {
        const res = await pool.query(
          `SELECT create_bill($1, $2, $3, $4, $5, $6::jsonb) as bill`,
          [
            dateStr,
            customerId,
            customerName,
            phone,
            paymentMethod,
            JSON.stringify(items),
          ]
        );
        totalBillsCreated++;
        if (res.rows[0]?.bill?.total) {
          totalSalesAmount += Number(res.rows[0].bill.total);
        }
      } catch (err) {
        console.error(`Error creating bill on ${dateStr}:`, err.message);
      }
    }

    // 20% chance to record a shop expense on this day
    if (Math.random() < 0.25 && expCategories.length > 0) {
      const expCat = pick(expCategories);
      const expMethod = Math.random() < 0.7 ? 'cash' : 'upi';
      const expAmt = expCat.name.toLowerCase().includes('electricity')
        ? randInt(800, 1500)
        : expCat.name.toLowerCase().includes('tea') || expCat.name.toLowerCase().includes('refreshment')
        ? randInt(40, 120)
        : randInt(150, 600);

      try {
        await pool.query(`
          INSERT INTO expenses (expense_date, category_id, amount, method, note)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          dateStr,
          expCat.id,
          expAmt,
          expMethod,
          `Shop expense: ${expCat.name}`
        ]);
        totalExpensesCreated++;
      } catch (err) {
        // ignore
      }
    }

    // 10% chance for an account payment if it's weekday
    if (!isWeekend && Math.random() < 0.15 && accountCustomers.length > 0) {
      const acctCust = pick(accountCustomers);
      const payAmt = randInt(100, 500);
      const payMethod = Math.random() < 0.6 ? 'upi' : 'cash';
      try {
        await pool.query(`
          INSERT INTO account_payments (customer_id, amount, method, paid_on, note)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          acctCust.id,
          payAmt,
          payMethod,
          dateStr,
          `Account credit cleared via ${payMethod.toUpperCase()}`
        ]);
      } catch (err) {
        // ignore
      }
    }
  }

  console.log(`\n================ SEEDING COMPLETE ================`);
  console.log(`Total Bills Created: ${totalBillsCreated}`);
  console.log(`Total Sales Value: Rs. ${totalSalesAmount.toLocaleString('en-IN')}`);
  console.log(`Total Expenses Recorded: ${totalExpensesCreated}`);
  console.log(`Date Range: 2026-10-01 to 2026-11-24 (55 days)`);
  console.log(`==================================================\n`);

  await pool.end();
}

seed().catch(err => {
  console.error('Fatal error seeding mock data:', err);
  pool.end();
  process.exit(1);
});
