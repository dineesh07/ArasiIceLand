import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';
import { getActiveWorkspace } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const categoryId = searchParams.get('categoryId');

    let sql = `
      select 
        e.id, e.expense_date, e.category_id, e.amount, e.method, 
        e.note, e.vendor_order_id, e.created_at, e.workspace,
        ec.name as category_name,
        vo.order_no as vendor_order_no
      from expenses e
      join expense_categories ec on ec.id = e.category_id
      left join vendor_orders vo on vo.id = e.vendor_order_id
      where e.deleted_at is null and e.workspace = $1
    `;

    const params: any[] = [workspace];

    if (month) {
      params.push(`${month}%`);
      sql += ` and e.expense_date::text like $${params.length}`;
    }

    if (categoryId) {
      params.push(categoryId);
      sql += ` and e.category_id = $${params.length}`;
    }

    sql += ' order by e.expense_date desc, e.created_at desc';

    const expenses = await query(sql, params);
    const total = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    return NextResponse.json({ expenses, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const body = await request.json();
    const { expense_date, category_id, amount, method, note } = body;

    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    if (!category_id) {
      return NextResponse.json({ error: 'Expense category is required' }, { status: 400 });
    }

    if (!method || !['cash', 'upi'].includes(method)) {
      return NextResponse.json({ error: 'Payment method must be cash or upi' }, { status: 400 });
    }

    const expense = await queryOne(`
      insert into expenses (expense_date, category_id, amount, method, note, workspace)
      values (coalesce($1, $2), $3, $4, $5, $6, $7)
      returning *
    `, [
      expense_date || null,
      todayIST(),
      category_id,
      parsedAmount,
      method,
      note ? note.trim() : null,
      workspace
    ]);

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    await query('update expenses set deleted_at = now() where id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
