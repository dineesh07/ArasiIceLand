import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountsOnly = searchParams.get('accountsOnly') === 'true';

    let sql = `
      select 
        c.id, c.name, c.phone, c.is_account, c.active, c.created_at,
        get_customer_account_balance(c.id) as balance
      from customers c
      where c.active = true
    `;

    if (accountsOnly) {
      sql += ' and c.is_account = true';
    }

    sql += ' order by balance desc, c.name asc';

    const customers = await query(sql);

    // Calculate total outstanding balance
    const totalOutstanding = customers.reduce((sum: number, c: any) => sum + (c.balance > 0 ? c.balance : 0), 0);

    return NextResponse.json({ customers, totalOutstanding });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, is_account } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const customer = await queryOne(`
      insert into customers (name, phone, is_account)
      values ($1, $2, coalesce($3, false))
      returning *
    `, [name.trim(), phone ? phone.trim() : null, is_account]);

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, is_account, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const updated = await queryOne(`
      update customers set
        name = coalesce($1, name),
        phone = $2,
        is_account = coalesce($3, is_account),
        active = coalesce($4, active)
      where id = $5
      returning *
    `, [
      name ? name.trim() : null,
      phone === undefined ? null : phone ? phone.trim() : null,
      is_account,
      active,
      id
    ]);

    return NextResponse.json({ customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

