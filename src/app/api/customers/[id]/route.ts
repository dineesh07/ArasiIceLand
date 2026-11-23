import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    const customer = await queryOne(`
      select 
        c.id, c.name, c.phone, c.is_account, c.active,
        get_customer_account_balance(c.id) as balance
      from customers c
      where c.id = $1
    `, [customerId]);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Bills billed to account
    const bills = await query(`
      select 
        b.id, b.bill_date, b.total, b.payment_method, b.created_at,
        json_agg(
          json_build_object(
            'service_name', bi.service_name,
            'quantity', bi.quantity,
            'unit_rate', bi.unit_rate,
            'amount', bi.amount
          )
        ) as items
      from bills b
      left join bill_items bi on bi.bill_id = b.id
      where b.customer_id = $1 
        and b.payment_method = 'account' 
        and b.deleted_at is null
      group by b.id
      order by b.bill_date desc, b.created_at desc
    `, [customerId]);

    // Payments recorded
    const payments = await query(`
      select id, amount, method, paid_on, note, created_at
      from account_payments
      where customer_id = $1 and deleted_at is null
      order by paid_on desc, created_at desc
    `, [customerId]);

    return NextResponse.json({
      customer,
      bills,
      payments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

