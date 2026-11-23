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

    if (!payment_method || !['cash', 'upi', 'account'].includes(payment_method)) {
      return NextResponse.json({ error: 'Valid payment method (cash, upi, account) is required' }, { status: 400 });
    }

    const deliveryDate = date || todayIST();

    // Call transactional deliver_tailoring_order PL/pgSQL function
    const result = await queryOne(`
      select deliver_tailoring_order($1, $2, $3) as delivery
    `, [order_id, payment_method, deliveryDate]);

    return NextResponse.json({ delivery: result?.delivery });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

