import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const services = await query(`
      select 
        s.id, s.category_id, s.name, s.active, s.pricing_type, 
        s.unit_label, s.rate, s.min_charge, s.sort_order,
        c.name as category_name
      from services s
      join categories c on c.id = s.category_id
      order by c.sort_order asc, s.sort_order asc, s.name asc
    `);
    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_id, name, pricing_type, unit_label, rate, min_charge, sort_order } = body;

    if (!category_id || !name || !pricing_type || rate === undefined || rate === null) {
      return NextResponse.json({ error: 'Missing required service fields' }, { status: 400 });
    }

    const newService = await queryOne(`
      insert into services (category_id, name, pricing_type, unit_label, rate, min_charge, sort_order)
      values ($1, $2, $3, $4, $5, $6, coalesce($7, 0))
      returning *
    `, [category_id, name.trim(), pricing_type, unit_label || null, parseInt(rate), min_charge ? parseInt(min_charge) : null, sort_order || 0]);

    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, pricing_type, unit_label, rate, min_charge, active, sort_order, category_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const updated = await queryOne(`
      update services set
        name = coalesce($1, name),
        pricing_type = coalesce($2, pricing_type),
        unit_label = $3,
        rate = coalesce($4, rate),
        min_charge = $5,
        active = coalesce($6, active),
        sort_order = coalesce($7, sort_order),
        category_id = coalesce($8, category_id)
      where id = $9
      returning *
    `, [
      name ? name.trim() : null,
      pricing_type,
      unit_label === undefined ? null : unit_label,
      rate !== undefined ? parseInt(rate) : null,
      min_charge ? parseInt(min_charge) : null,
      active,
      sort_order,
      category_id,
      id
    ]);

    return NextResponse.json({ service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Check if service is referenced in past bills
    const used = await queryOne('select id from bill_items where service_id = $1 limit 1', [id]);
    if (used) {
      // Gracefully deactivate instead of hard delete to preserve historical integrity
      await query('update services set active = false where id = $1', [id]);
      return NextResponse.json({ deactivated: true, message: 'Service was used in past bills and has been deactivated.' });
    }

    await query('delete from services where id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

