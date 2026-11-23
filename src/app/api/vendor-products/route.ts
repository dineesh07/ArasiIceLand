import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const products = await query('select id, name, unit, active from vendor_products order by active desc, name asc');
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, unit } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const product = await queryOne(`
      insert into vendor_products (name, unit, active)
      values ($1, $2, true)
      returning *
    `, [name.trim(), unit ? unit.trim() : null]);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, unit, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await queryOne(`
      update vendor_products set
        name = coalesce($1, name),
        unit = $2,
        active = coalesce($3, active)
      where id = $4
      returning *
    `, [name ? name.trim() : null, unit, active, id]);

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

