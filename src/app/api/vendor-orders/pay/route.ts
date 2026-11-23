import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, payment_method, date } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!payment_method || !['cash', 'upi'].includes(payment_method)) {
      return NextResponse.json({ error: 'Payment method must be cash or upi' }, { status: 400 });
    }

    const payDate = date || todayIST();

    // Call transactional pay_vendor_order PL/pgSQL function
    const result = await queryOne(`
      select pay_vendor_order($1, $2, $3) as payment
    `, [order_id, payment_method, payDate]);

    return NextResponse.json({ payment: result?.payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

