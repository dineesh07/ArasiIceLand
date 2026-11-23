import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let sql = `
      select 
        sub.id,
        sub.category_id,
        sub.name,
        sub.sort_order,
        sub.created_at,
        c.name as category_name,
        count(s.id)::int as service_count
      from subcategories sub
      join categories c on c.id = sub.category_id
      left join services s on s.subcategory_id = sub.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (categoryId) {
      params.push(categoryId);
      conditions.push(`sub.category_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' where ' + conditions.join(' and ');
    }

    sql += ' group by sub.id, c.name order by sub.sort_order asc, sub.name asc';

    const subcategories = await query(sql, params);
    return NextResponse.json({ subcategories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_id, name, sort_order } = body;

    if (!category_id || !name || !name.trim()) {
      return NextResponse.json({ error: 'Category ID and Subcategory name are required' }, { status: 400 });
    }

    const newSubcategory = await queryOne(`
      insert into subcategories (category_id, name, sort_order)
      values ($1, $2, coalesce($3, 0))
      on conflict (category_id, name) do update
      set sort_order = excluded.sort_order
      returning *
    `, [category_id, name.trim(), sort_order || 0]);

    return NextResponse.json({ subcategory: newSubcategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 });
    }

    const updated = await queryOne(`
      update subcategories set
        name = coalesce($1, name),
        sort_order = coalesce($2, sort_order)
      where id = $3
      returning *
    `, [
      name ? name.trim() : null,
      sort_order !== undefined ? sort_order : null,
      id
    ]);

    return NextResponse.json({ subcategory: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 });
    }

    // Unlink services first so services are orphaned into "No group" instead of deleted
    await query('update services set subcategory_id = null where subcategory_id = $1', [id]);
    await query('delete from subcategories where id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

