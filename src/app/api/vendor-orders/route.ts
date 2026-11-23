import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';

export async function GET() {
  try {
    const orders = await query(`
      select 
        vo.id, vo.order_no, vo.order_date, vo.status, vo.quoted_amount,
        vo.delivered_on, vo.paid_on, vo.payment_method, vo.note, vo.created_at,
        json_agg(
          json_build_object(
            'id', voi.id,
            'product_name', voi.product_name,
            'quantity', voi.quantity,
            'unit', voi.unit
          )
        ) as items
      from vendor_orders vo
      left join vendor_order_items voi on voi.order_id = vo.id
      group by vo.id
      order by vo.order_date desc, vo.order_no desc
    `);

    // Vendor payables total (quoted_amount where status = 'delivered')
    const payables = await queryOne('select get_vendor_payables() as payables');

    // Fetch shop & vendor settings
    const settings = await queryOne('select shop_name, shop_address, vendor_name, vendor_phone, shop_phone from settings where id = 1');

    return NextResponse.json({
      orders,
      payables: payables?.payables || 0,
      settings: settings || {
        shop_name: 'Arasi Iceland',
        shop_address: '',
        vendor_name: 'Distributor',
        vendor_phone: '',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_date, note, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one product item' }, { status: 400 });
    }

    const finalDate = (order_date && typeof order_date === 'string' && order_date.trim())
      ? order_date.trim()
      : todayIST();

    const order = await queryOne(`
      insert into vendor_orders (order_date, status, note)
      values ($1, 'ordered', $2)
      returning *
    `, [finalDate, note && note.trim() ? note.trim() : null]);

    if (!order) {
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
    }

    for (const item of items) {
      const qty = parseFloat(item.quantity) || 1;
      await query(`
        insert into vendor_order_items (order_id, product_name, quantity, unit)
        values ($1, $2, $3, $4)
      `, [order.id, item.product_name, qty, item.unit || null]);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Vendor order creation error:', error);
    return NextResponse.json({ error: error.message || 'Server error creating order' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, quoted_amount, delivered_on, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await queryOne(`
      update vendor_orders set
        status = coalesce($1, status),
        quoted_amount = coalesce($2, quoted_amount),
        delivered_on = coalesce($3, delivered_on),
        note = coalesce($4, note)
      where id = $5
      returning *
    `, [status, quoted_amount ? parseInt(quoted_amount) : null, delivered_on, note, id]);

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

