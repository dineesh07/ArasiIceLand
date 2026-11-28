import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';
import { getActiveWorkspace } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const today = todayIST();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const month = searchParams.get('month'); // YYYY-MM
    const categoryId = searchParams.get('categoryId');
    const expenseType = searchParams.get('expenseType'); // 'shop' | 'personal' | 'all'

    let sql = `
      select 
        e.id, e.expense_date::text as expense_date, e.category_id, e.amount, e.method, 
        e.note, e.vendor_order_id, e.created_at, e.workspace,
        coalesce(e.expense_type, 'shop') as expense_type,
        ec.name as category_name,
        vo.order_no as vendor_order_no
      from expenses e
      join expense_categories ec on ec.id = e.category_id
      left join vendor_orders vo on vo.id = e.vendor_order_id
      where e.deleted_at is null and e.workspace = $1
    `;

    const params: any[] = [workspace];

    if (date) {
      params.push(date);
      sql += ` and e.expense_date = $${params.length}::date`;
    } else if (month) {
      params.push(`${month}%`);
      sql += ` and e.expense_date::text like $${params.length}`;
    }

    if (categoryId && categoryId !== 'all') {
      params.push(categoryId);
      sql += ` and e.category_id = $${params.length}`;
    }

    if (expenseType && expenseType !== 'all') {
      params.push(expenseType);
      sql += ` and coalesce(e.expense_type, 'shop') = $${params.length}`;
    }

    sql += ' order by e.expense_date desc, e.created_at desc';

    const expenses = await query(sql, params);
    const total = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const shopTotal = expenses
      .filter((e: any) => e.expense_type !== 'personal')
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const personalTotal = expenses
      .filter((e: any) => e.expense_type === 'personal')
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    // Always compute today's expenses summary for the active workspace
    const todaySummary = await queryOne(`
      select
        coalesce(sum(amount), 0)::int as today_total,
        coalesce(sum(case when coalesce(expense_type, 'shop') = 'shop' then amount else 0 end), 0)::int as today_shop_total,
        coalesce(sum(case when coalesce(expense_type, 'shop') = 'personal' then amount else 0 end), 0)::int as today_personal_total
      from expenses
      where deleted_at is null and workspace = $1 and expense_date = $2::date
    `, [workspace, today]);

    return NextResponse.json({
      expenses,
      total,
      shopTotal,
      personalTotal,
      todayTotal: todaySummary?.today_total || 0,
      todayShopTotal: todaySummary?.today_shop_total || 0,
      todayPersonalTotal: todaySummary?.today_personal_total || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getActiveWorkspace();
    const body = await request.json();
    const { expense_date, category_id, amount, method, note, expense_type } = body;

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

    const finalDate =
      expense_date && typeof expense_date === 'string' && expense_date.trim()
        ? expense_date.trim()
        : todayIST();

    // Determine expense_type ('shop' | 'personal')
    let finalType = expense_type === 'personal' ? 'personal' : 'shop';
    const catRow = await queryOne('select name from expense_categories where id = $1', [category_id]);
    if (catRow?.name?.toLowerCase().includes('personal')) {
      finalType = 'personal';
    }

    const expense = await queryOne(`
      insert into expenses (expense_date, category_id, amount, method, note, workspace, expense_type)
      values ($1::date, $2, $3, $4, $5, $6, $7)
      returning *
    `, [
      finalDate,
      category_id,
      parsedAmount,
      method,
      note ? note.trim() : null,
      workspace,
      finalType,
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
