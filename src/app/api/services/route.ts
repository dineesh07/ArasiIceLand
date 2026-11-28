import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let sql = `
      select 
        s.id, s.category_id, s.subcategory_id, s.size_label, s.name, s.active, s.pricing_type, 
        s.unit_label, s.rate, s.min_charge, s.sort_order,
        c.name as category_name,
        sub.name as subcategory_name,
        sub.sort_order as subcategory_sort_order
      from services s
      join categories c on c.id = s.category_id
      left join subcategories sub on sub.id = s.subcategory_id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (categoryId) {
      params.push(categoryId);
      conditions.push(`s.category_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' where ' + conditions.join(' and ');
    }

    sql += ' order by c.sort_order asc, coalesce(sub.sort_order, 999) asc, s.sort_order asc, s.name asc';

    const services = await query(sql, params);
    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_id, subcategory_id, size_label, name, pricing_type, unit_label, rate, min_charge, sort_order, active } = body;

    if (!category_id || !name || !pricing_type || rate === undefined || rate === null) {
      return NextResponse.json({ error: 'Missing required service fields' }, { status: 400 });
    }

    const newService = await queryOne(`
      insert into services (category_id, subcategory_id, size_label, name, pricing_type, unit_label, rate, min_charge, sort_order, active)
      values ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, 0), coalesce($10, true))
      returning *
    `, [
      category_id,
      subcategory_id || null,
      size_label ? size_label.trim() : null,
      name.trim(),
      pricing_type,
      unit_label || null,
      parseInt(rate),
      min_charge ? parseInt(min_charge) : null,
      sort_order || 0,
      active !== undefined ? active : true,
    ]);

    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, subcategory_id, size_label, name, pricing_type, unit_label, rate, min_charge, active, sort_order, category_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const updated = await queryOne(`
      update services set
        name = coalesce($1, name),
        pricing_type = coalesce($2, pricing_type),
        unit_label = case when $3 = '__NULL__' then null when $3 is not null then $3 else unit_label end,
        rate = coalesce($4, rate),
        min_charge = case when $5 = -1 then null when $5 is not null then $5 else min_charge end,
        active = coalesce($6, active),
        sort_order = coalesce($7, sort_order),
        category_id = coalesce($8, category_id),
        subcategory_id = case when $9 = '__NULL__' then null when $9 is not null then $9::uuid else subcategory_id end,
        size_label = case when $10 = '__NULL__' then null when $10 is not null then $10 else size_label end
      where id = $11
      returning *
    `, [
      name ? name.trim() : null,
      pricing_type || null,
      unit_label === undefined ? null : (unit_label || '__NULL__'),
      rate !== undefined && rate !== null ? parseInt(rate) : null,
      min_charge === undefined ? null : (min_charge ? parseInt(min_charge) : -1),
      active !== undefined ? active : null,
      sort_order !== undefined ? sort_order : null,
      category_id || null,
      subcategory_id === undefined ? null : (subcategory_id || '__NULL__'),
      size_label === undefined ? null : (size_label ? size_label.trim() : '__NULL__'),
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
