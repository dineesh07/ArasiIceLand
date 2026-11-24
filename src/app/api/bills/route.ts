import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';
import { getActiveWorkspace } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const bill = await queryOne(`
        select 
          b.id, b.bill_date, b.token_no, b.customer_id, b.customer_name, 
          b.phone, b.payment_method, b.total, b.tailoring_order_id, b.created_at, b.workspace,
          c.name as account_customer_name,
          json_agg(
            json_build_object(
              'id', bi.id,
              'service_id', bi.service_id,
              'category_id', bi.category_id,
              'service_name', bi.service_name,
              'pricing_type', bi.pricing_type,
              'quantity', bi.quantity,
              'unit_rate', bi.unit_rate,
              'min_charge', bi.min_charge,
              'amount', bi.amount
            )
          ) as items
        from bills b
        left join customers c on c.id = b.customer_id
        left join bill_items bi on bi.bill_id = b.id
        where b.id = $1 and b.workspace = $2 and b.deleted_at is null
        group by b.id, c.name
      `, [id, workspace]);

      if (!bill) {
        return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
      }

      return NextResponse.json({ bill });
    }

    const date = searchParams.get('date') || todayIST();

    const bills = await query(`
      select 
        b.id, b.bill_date, b.token_no, b.customer_id, b.customer_name, 
        b.phone, b.payment_method, b.total, b.tailoring_order_id, b.created_at, b.workspace,
        c.name as account_customer_name,
        json_agg(
          json_build_object(
            'id', bi.id,
            'service_id', bi.service_id,
            'category_id', bi.category_id,
            'service_name', bi.service_name,
            'pricing_type', bi.pricing_type,
            'quantity', bi.quantity,
            'unit_rate', bi.unit_rate,
            'min_charge', bi.min_charge,
            'amount', bi.amount
          )
        ) as items
      from bills b
      left join customers c on c.id = b.customer_id
      left join bill_items bi on bi.bill_id = b.id
      where b.bill_date = $1 and b.workspace = $2 and b.deleted_at is null
      group by b.id, c.name
      order by b.created_at desc
    `, [date, workspace]);

    // Today's summary totals for active workspace
    const summary = await queryOne(`
      select 
        coalesce(sum(case when payment_method = 'cash' then total else 0 end), 0) as cash_total,
        coalesce(sum(case when payment_method = 'upi' then total else 0 end), 0) as upi_total,
        coalesce(sum(case when payment_method = 'account' then total else 0 end), 0) as account_total,
        coalesce(sum(total), 0) as grand_total,
        count(*) as count
      from bills
      where bill_date = $1 and workspace = $2 and deleted_at is null
    `, [date, workspace]);

    return NextResponse.json({ bills, summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const body = await request.json();
    const { bill_date, customer_id, customer_name, phone, payment_method, items } = body;

    const targetDate = bill_date || todayIST();

    if (!payment_method || !['cash', 'upi', 'account'].includes(payment_method)) {
      return NextResponse.json({ error: 'Valid payment method (cash, upi, account) is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Bill must contain at least one line item' }, { status: 400 });
    }

    // Call atomic transactional create_bill PL/pgSQL function with workspace
    const result = await queryOne(`
      select create_bill($1, $2, $3, $4, $5, $6::jsonb, $7) as bill
    `, [
      targetDate,
      customer_id || null,
      customer_name ? customer_name.trim() : null,
      phone ? phone.trim() : null,
      payment_method,
      JSON.stringify(items),
      workspace
    ]);

    return NextResponse.json({ bill: result?.bill }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, customer_id, customer_name, phone, payment_method, items } = body;

    if (!id) {
      return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
    }

    const result = await queryOne(`
      select update_bill($1, $2, $3, $4, $5, $6::jsonb) as bill
    `, [
      id,
      customer_id || null,
      customer_name ? customer_name.trim() : null,
      phone ? phone.trim() : null,
      payment_method,
      JSON.stringify(items)
    ]);

    return NextResponse.json({ bill: result?.bill });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
    }

    await query('select soft_delete_bill($1)', [id]);

    return NextResponse.json({ success: true, message: 'Bill soft deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
