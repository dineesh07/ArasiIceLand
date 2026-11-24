import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getActiveWorkspace } from '@/lib/auth';

export async function GET() {
  try {
    const workspace = await getActiveWorkspace();
    let sql = 'select id, name, sort_order from categories';
    if (workspace === 'kalai') {
      sql += " where lower(name) = 'ice cream'";
    }
    sql += ' order by sort_order asc, name asc';
    const categories = await query(sql);
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
