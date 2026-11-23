import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    let settings = await queryOne('select id, shop_name, vendor_name, vendor_phone, shop_phone from settings where id = 1');
    if (!settings) {
      settings = await queryOne(`
        insert into settings (id, shop_name)
        values (1, 'Shop Manager')
        returning *
      `);
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { shop_name, vendor_name, vendor_phone, shop_phone } = body;

    const settings = await queryOne(`
      update settings set
        shop_name = coalesce($1, shop_name),
        vendor_name = $2,
        vendor_phone = $3,
        shop_phone = $4,
        updated_at = now()
      where id = 1
      returning *
    `, [
      shop_name ? shop_name.trim() : null,
      vendor_name ? vendor_name.trim() : null,
      vendor_phone ? vendor_phone.trim() : null,
      shop_phone ? shop_phone.trim() : null
    ]);

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

