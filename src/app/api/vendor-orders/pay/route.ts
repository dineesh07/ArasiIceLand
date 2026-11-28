import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';
import { getActiveWorkspace } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const body = await request.json();
    const { order_id, payment_method, date, quoted_amount } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!payment_method || !['cash', 'upi'].includes(payment_method)) {
      return NextResponse.json({ error: 'Payment method must be cash or upi' }, { status: 400 });
    }

    const payDate = date || todayIST();

    const order = await queryOne(
      'select id, status, quoted_amount from vendor_orders where id = $1 and workspace = $2',
      [order_id, workspace]
    );

    if (!order) {
      return NextResponse.json({ error: 'Vendor order not found' }, { status: 404 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ error: 'Vendor order is already paid' }, { status: 400 });
    }

    // Support 1-step Deliver & Pay directly from 'ordered' status
    if (order.status === 'ordered') {
      const parsedAmt = parseInt(quoted_amount);
      if (!parsedAmt || parsedAmt <= 0) {
        return NextResponse.json({ error: 'Valid bill amount is required' }, { status: 400 });
      }
      await query(
        `update vendor_orders
         set status = 'delivered', quoted_amount = $1, delivered_on = $2::date
         where id = $3 and workspace = $4`,
        [parsedAmt, payDate, order_id, workspace]
      );
    }

    // Call transactional pay_vendor_order PL/pgSQL function
    const result = await queryOne(`
      select pay_vendor_order($1, $2, $3::date) as payment
    `, [order_id, payment_method, payDate]);

    // Ensure auto-created expense belongs to the active workspace
    if (result?.payment?.expense_id) {
      await query(
        `update expenses set workspace = $1, expense_type = 'shop' where id = $2`,
        [workspace, result.payment.expense_id]
      );
    }

    return NextResponse.json({ payment: result?.payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
