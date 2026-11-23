import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';

export async function GET() {
  try {
    const today = todayIST();

    const orders = await query(`
      select 
        o.id, o.customer_name, o.phone, o.received_on, o.delivery_date, 
        o.status, o.total, o.note, o.delivered_at, o.customer_id, o.created_at,
        case 
          when o.status = 'delivered' then 'delivered'
          when o.delivery_date < $1 then 'overdue'
          when o.delivery_date = $1 then 'due_today'
          else 'upcoming'
        end as urgency,
        json_agg(
          json_build_object(
            'id', oi.id,
            'service_id', oi.service_id,
            'service_name', oi.service_name,
            'quantity', oi.quantity,
            'unit_rate', oi.unit_rate,
            'amount', oi.amount
          )
        ) as items
      from tailoring_orders o
      left join tailoring_order_items oi on oi.order_id = o.id
      group by o.id
      order by 
        case when o.status = 'delivered' then 1 else 0 end asc,
        o.delivery_date asc,
        o.created_at desc
    `, [today]);

    const overdueCount = orders.filter((o: any) => o.status !== 'delivered' && o.urgency === 'overdue').length;
    const pendingTotal = orders
      .filter((o: any) => o.status !== 'delivered')
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    return NextResponse.json({ orders, overdueCount, pendingTotal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, phone, delivery_date, received_on, note, customer_id, items } = body;

    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!delivery_date) {
      return NextResponse.json({ error: 'Delivery date is required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one tailoring item' }, { status: 400 });
    }

    const total = items.reduce((sum: number, it: any) => sum + (it.unit_rate * it.quantity), 0);

    const order = await queryOne(`
      insert into tailoring_orders (
        customer_name, phone, received_on, delivery_date, note, customer_id, total
      ) values ($1, $2, coalesce($3, $4), $5, $6, $7, $8)
      returning *
    `, [
      customer_name.trim(),
      phone.trim(),
      received_on || null,
      todayIST(),
      delivery_date,
      note ? note.trim() : null,
      customer_id || null,
      total
    ]);

    // Insert order items
    for (const item of items) {
      await query(`
        insert into tailoring_order_items (order_id, service_id, service_name, quantity, unit_rate, amount)
        values ($1, $2, $3, $4, $5, $6)
      `, [
        order.id,
        item.service_id || null,
        item.service_name,
        parseInt(item.quantity),
        parseInt(item.unit_rate),
        parseInt(item.unit_rate) * parseInt(item.quantity)
      ]);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, delivery_date, note, items } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const currentOrder = await queryOne('select status from tailoring_orders where id = $1', [id]);
    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (currentOrder.status === 'delivered') {
      return NextResponse.json({ error: 'Delivered orders cannot be modified' }, { status: 400 });
    }

    if (items && Array.isArray(items)) {
      const newTotal = items.reduce((sum: number, it: any) => sum + (it.unit_rate * it.quantity), 0);
      await query('delete from tailoring_order_items where order_id = $1', [id]);
      for (const item of items) {
        await query(`
          insert into tailoring_order_items (order_id, service_id, service_name, quantity, unit_rate, amount)
          values ($1, $2, $3, $4, $5, $6)
        `, [
          id,
          item.service_id || null,
          item.service_name,
          parseInt(item.quantity),
          parseInt(item.unit_rate),
          parseInt(item.unit_rate) * parseInt(item.quantity)
        ]);
      }
      await query(`
        update tailoring_orders set
          status = coalesce($1, status),
          delivery_date = coalesce($2, delivery_date),
          note = coalesce($3, note),
          total = $4
        where id = $5
      `, [status, delivery_date, note, newTotal, id]);
    } else {
      await query(`
        update tailoring_orders set
          status = coalesce($1, status),
          delivery_date = coalesce($2, delivery_date),
          note = coalesce($3, note)
        where id = $4
      `, [status, delivery_date, note, id]);
    }

    const updated = await queryOne('select * from tailoring_orders where id = $1', [id]);
    return NextResponse.json({ order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

