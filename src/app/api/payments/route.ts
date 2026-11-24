import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';
import { getActiveWorkspace } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const body = await request.json();
    const { customer_id, amount, method, paid_on, note } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    if (!method || !['cash', 'upi'].includes(method)) {
      return NextResponse.json({ error: 'Payment method must be cash or upi' }, { status: 400 });
    }

    const payment = await queryOne(`
      insert into account_payments (customer_id, amount, method, paid_on, note, workspace)
      values ($1, $2, $3, coalesce($4, $5), $6, $7)
      returning *
    `, [
      customer_id,
      parsedAmount,
      method,
      paid_on || null,
      todayIST(),
      note ? note.trim() : null,
      workspace
    ]);

    // Fetch updated balance
    const updatedBalance = await queryOne(
      'select get_customer_account_balance($1) as balance',
      [customer_id]
    );

    return NextResponse.json({
      payment,
      balance: updatedBalance?.balance ?? 0,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
