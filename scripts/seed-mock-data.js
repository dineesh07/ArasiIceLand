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

async function seed() {
  console.log('Connecting to Neon DB to insert rich mock data...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // 1. Update settings
  console.log('Updating settings...');
  await client.query(`
    update settings set
      shop_name = 'Arasi Internet Centre & Ice Creams',
      shop_phone = '9840012345',
      vendor_name = 'Arun Ice Creams Distributor',
      vendor_phone = '9876543210'
    where id = 1;
  `);

  // 2. Fetch categories
  const catRes = await client.query('select id, name from categories');
  const catMap = {};
  catRes.rows.forEach(r => { catMap[r.name] = r.id; });

  const internetCatId = catMap['Internet Centre'];
  const iceCreamCatId = catMap['Ice Cream'];
  const tailoringCatId = catMap['Tailoring'];

  // Fetch services
  const srvRes = await client.query('select id, name, pricing_type, rate, min_charge, category_id from services');
  const srvMap = {};
  srvRes.rows.forEach(r => { srvMap[r.name] = r; });

  // Fetch expense categories
  const expCatRes = await client.query('select id, name from expense_categories');
  const expCatMap = {};
  expCatRes.rows.forEach(r => { expCatMap[r.name] = r.id; });

  // 3. Clear mock data safely to prevent duplicate confusion
  console.log('Refreshing sample transactions...');
  await client.query(`
    delete from bill_items;
    delete from bills;
    delete from daily_token_counters;
    delete from account_payments;
    delete from tailoring_order_items;
    delete from tailoring_orders;
    delete from expenses;
    delete from vendor_order_items;
    delete from vendor_orders;
    delete from customers;
  `);

  // 4. Create Customers
  console.log('Creating customers...');
  const custRamesh = (await client.query(`
    insert into customers (name, phone, is_account, active)
    values ('Ramesh Kumar', '9840112233', true, true)
    returning id;
  `)).rows[0].id;

  const custMeenakshi = (await client.query(`
    insert into customers (name, phone, is_account, active)
    values ('Meenakshi Sundaram', '9443221100', true, true)
    returning id;
  `)).rows[0].id;

  const custKavitha = (await client.query(`
    insert into customers (name, phone, is_account, active)
    values ('Kavitha Rajan', '9884556677', true, true)
    returning id;
  `)).rows[0].id;

  const custAnand = (await client.query(`
    insert into customers (name, phone, is_account, active)
    values ('Anand Natarajan', '9940123456', false, true)
    returning id;
  `)).rows[0].id;

  // 5. Create Tailoring Orders
  console.log('Creating tailoring orders...');
  // Overdue order
  const orderOverdue = (await client.query(`
    insert into tailoring_orders (customer_name, phone, received_on, delivery_date, status, total, note)
    values ('Priya Dharshini', '9841234567', '2026-11-15', '2026-11-19', 'received', 800, 'Golden piping on neck, urgent')
    returning id;
  `)).rows[0].id;

  await client.query(`
    insert into tailoring_order_items (order_id, service_name, quantity, unit_rate, amount)
    values ($1, 'Lining Blouse', 2, 400, 800);
  `, [orderOverdue]);

  // Due today order (Ready)
  const orderDueToday = (await client.query(`
    insert into tailoring_orders (customer_name, phone, received_on, delivery_date, status, total, note)
    values ('Revathi S.', '9790123456', '2026-11-18', '2026-11-22', 'ready', 650, 'Stitched and ironed. Ready for pickup.')
    returning id;
  `)).rows[0].id;

  await client.query(`
    insert into tailoring_order_items (order_id, service_name, quantity, unit_rate, amount)
    values ($1, 'Churidar with Lining', 1, 650, 650);
  `, [orderDueToday]);

  // Upcoming order
  const orderUpcoming = (await client.query(`
    insert into tailoring_orders (customer_name, phone, received_on, delivery_date, status, total, note)
    values ('Lakshmi Narayanan', '9884112233', '2026-11-20', '2026-11-26', 'received', 500, 'Normal 2 blouses')
    returning id;
  `)).rows[0].id;

  await client.query(`
    insert into tailoring_order_items (order_id, service_name, quantity, unit_rate, amount)
    values ($1, 'Blouse', 2, 250, 500);
  `, [orderUpcoming]);

  // Delivered order via function
  const orderDelivered = (await client.query(`
    insert into tailoring_orders (customer_name, phone, received_on, delivery_date, status, total, note)
    values ('Saradha Ammal', '9444332211', '2026-11-14', '2026-11-21', 'received', 400, 'Lining blouse')
    returning id;
  `)).rows[0].id;

  await client.query(`
    insert into tailoring_order_items (order_id, service_name, quantity, unit_rate, amount)
    values ($1, 'Lining Blouse', 1, 400, 400);
  `, [orderDelivered]);

  // Deliver order
  await client.query(`
    select deliver_tailoring_order($1, 'cash', '2026-11-22');
  `, [orderDelivered]);

  // 6. Create Bills using create_bill function
  console.log('Creating counter bills...');

  // Past bills (Nov 20 and 21)
  await client.query(`
    select create_bill(
      '2026-11-20'::date, null, null, null, 'cash',
      '[{"service_name":"B/W Single Side","category_id":"${internetCatId}","pricing_type":"PER_UNIT_MIN","quantity":10,"unit_rate":2,"min_charge":10}]'::jsonb
    );
    select create_bill(
      '2026-11-20'::date, null, null, null, 'upi',
      '[{"service_name":"Vanilla Cup","category_id":"${iceCreamCatId}","pricing_type":"FIXED","quantity":4,"unit_rate":25,"min_charge":null}]'::jsonb
    );
    select create_bill(
      '2026-11-21'::date, null, null, null, 'cash',
      '[{"service_name":"Typing","category_id":"${internetCatId}","pricing_type":"PER_UNIT","quantity":5,"unit_rate":20,"min_charge":null}]'::jsonb
    );
    select create_bill(
      '2026-11-21'::date, '${custMeenakshi}', 'Meenakshi Sundaram', '9443221100', 'account',
      '[{"service_name":"Community Certificate","category_id":"${internetCatId}","pricing_type":"FIXED","quantity":1,"unit_rate":150,"min_charge":null},{"service_name":"Colour Single Side","category_id":"${internetCatId}","pricing_type":"PER_UNIT","quantity":5,"unit_rate":10,"min_charge":null}]'::jsonb
    );
  `);

  // Today's bills (2026-11-22)
  // Bill 1: Walk-in nameless -> Token #1 (B/W Single Side, 5 pages = ₹10 min applied)
  await client.query(`
    select create_bill(
      '2026-11-22'::date, null, null, null, 'cash',
      '[{"service_name":"B/W Single Side","category_id":"${internetCatId}","pricing_type":"PER_UNIT_MIN","quantity":5,"unit_rate":2,"min_charge":10}]'::jsonb
    );
  `);

  // Bill 2: Walk-in nameless -> Token #2 (Ice Cream: Vanilla Cup x 2 + Choco Bar x 1 = ₹85, UPI)
  await client.query(`
    select create_bill(
      '2026-11-22'::date, null, null, null, 'upi',
      '[{"service_name":"Vanilla Cup","category_id":"${iceCreamCatId}","pricing_type":"FIXED","quantity":2,"unit_rate":25,"min_charge":null},{"service_name":"Choco Bar","category_id":"${iceCreamCatId}","pricing_type":"FIXED","quantity":1,"unit_rate":35,"min_charge":null}]'::jsonb
    );
  `);

  // Bill 3: Anand Natarajan (named, no token) -> Typing (3 pages x 20 = ₹60) + Colour Print (2 pages x 10 = ₹20) = ₹80, Cash
  await client.query(`
    select create_bill(
      '2026-11-22'::date, '${custAnand}', 'Anand Natarajan', '9940123456', 'cash',
      '[{"service_name":"Typing","category_id":"${internetCatId}","pricing_type":"PER_UNIT","quantity":3,"unit_rate":20,"min_charge":null},{"service_name":"Colour Single Side","category_id":"${internetCatId}","pricing_type":"PER_UNIT","quantity":2,"unit_rate":10,"min_charge":null}]'::jsonb
    );
  `);

  // Bill 4: Ramesh Kumar (Account customer) -> PAN Card Application (1 x ₹200) + Community Certificate (1 x ₹150) = ₹350, Account
  await client.query(`
    select create_bill(
      '2026-11-22'::date, '${custRamesh}', 'Ramesh Kumar', '9840112233', 'account',
      '[{"service_name":"PAN Card Application","category_id":"${internetCatId}","pricing_type":"FIXED","quantity":1,"unit_rate":200,"min_charge":null},{"service_name":"Community Certificate","category_id":"${internetCatId}","pricing_type":"FIXED","quantity":1,"unit_rate":150,"min_charge":null}]'::jsonb
    );
  `);

  // Bill 5: Walk-in nameless -> Token #3 (Butterscotch Cone x 3 = ₹150, UPI)
  await client.query(`
    select create_bill(
      '2026-11-22'::date, null, null, null, 'upi',
      '[{"service_name":"Butterscotch Cone","category_id":"${iceCreamCatId}","pricing_type":"FIXED","quantity":3,"unit_rate":50,"min_charge":null}]'::jsonb
    );
  `);

  // 7. Account Payments
  console.log('Recording account payments...');
  // Ramesh pays ₹150 towards his ₹350 bill -> balance is ₹200
  await client.query(`
    insert into account_payments (customer_id, amount, method, paid_on, note)
    values ('${custRamesh}', 150, 'upi', '2026-11-22', 'GPay partial payment');
  `);

  // Meenakshi pays ₹100 on Nov 21 towards her ₹200 bill -> balance is ₹100
  await client.query(`
    insert into account_payments (customer_id, amount, method, paid_on, note)
    values ('${custMeenakshi}', 100, 'cash', '2026-11-21', 'Cash at counter');
  `);

  // 8. Expenses
  console.log('Creating expenses...');
  const electricityCat = expCatMap['Electricity'] || Object.values(expCatMap)[0];
  const paperCat = expCatMap['Paper & Ink'] || Object.values(expCatMap)[0];
  const printerCat = expCatMap['Printer Service'] || Object.values(expCatMap)[0];
  const rentCat = expCatMap['Rent'] || Object.values(expCatMap)[0];

  await client.query(`
    insert into expenses (expense_date, category_id, amount, method, note) values
      ('2026-11-05', '${rentCat}', 6000, 'upi', 'Shop Monthly Rent Nov 2026'),
      ('2026-11-18', '${electricityCat}', 1850, 'upi', 'TNEB Electricity Bill'),
      ('2026-11-20', '${paperCat}', 620, 'cash', 'JK Copier A4 Paper 2 Reams'),
      ('2026-11-22', '${printerCat}', 350, 'cash', 'HP Black Toner Refill');
  `);

  // 9. Vendor Orders
  console.log('Creating vendor orders...');
  // Order 1: Paid stock order
  const vo1 = (await client.query(`
    insert into vendor_orders (order_date, status, quoted_amount, delivered_on)
    values ('2026-11-12', 'delivered', 2400, '2026-11-13')
    returning id;
  `)).rows[0].id;

  await client.query(`
    insert into vendor_order_items (order_id, product_name, quantity, unit) values
      ($1, 'Vanilla Cup (Carton of 24)', 2, 'box'),
      ($1, 'Choco Bar (Carton of 30)', 2, 'box');
  `, [vo1]);

  await client.query(`
    select pay_vendor_order($1, 'upi', '2026-11-14');
  `, [vo1]);

  // Order 2: Delivered & Unpaid stock order (Shows under vendor payables = ₹3,150)
  const vo2 = (await client.query(`
    insert into vendor_orders (order_date, status, quoted_amount, delivered_on, note)
    values ('2026-11-19', 'delivered', 3150, '2026-11-20', 'Received in good condition')
    returning id;
  `)).rows[0].id;

  await client.query(`
    insert into vendor_order_items (order_id, product_name, quantity, unit) values
      ($1, 'Butterscotch Cone (Carton of 20)', 3, 'box'),
      ($1, 'Kulfi (Carton of 24)', 2, 'box');
  `, [vo2]);

  // Order 3: Active ordered stock
  const vo3 = (await client.query(`
    insert into vendor_orders (order_date, status, note)
    values ('2026-11-22', 'ordered', 'Please deliver today by 4 PM for evening rush')
    returning id;
  `)).rows[0].id;

  await client.query(`
    insert into vendor_order_items (order_id, product_name, quantity, unit) values
      ($1, 'Choco Bar (Carton of 30)', 3, 'box'),
      ($1, 'Vanilla Cup (Carton of 24)', 2, 'box');
  `, [vo3]);

  console.log('\n=============================================');
  console.log('✅ ALL MOCK DATA INSERTED SUCCESSFULLY!');
  console.log('=============================================');
  console.log('- 5 Today bills (Tokens #1, #2, #3, plus named walk-ins and account bills)');
  console.log('- Delivered Tailoring order in today income');
  console.log('- Active account customers with outstanding balances (Ramesh: ₹200, Meenakshi: ₹100)');
  console.log('- Tailoring orders in Overdue (Priya), Due Today (Revathi), Upcoming, and Delivered states');
  console.log('- Expenses with Paper, Ink, Electricity, Rent and auto-linked Vendor Orders');
  console.log('- Vendor Orders: Paid, Delivered (Payable = ₹3,150), and Pending Order');
  console.log('=============================================\n');

  await client.end();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

