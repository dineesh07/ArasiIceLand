import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { todayIST } from '@/lib/dates';
import { getActiveWorkspace } from '@/lib/auth';

export async function GET() {
  try {
    const workspace = await getActiveWorkspace();
    const today = todayIST();

    // Check last token for active workspace without incrementing
    const counter = await queryOne(`
      select last_token from daily_token_counters where bill_date = $1 and workspace = $2
    `, [today, workspace]);

    const nextToken = (counter?.last_token || 0) + 1;

    // Today's collected for active workspace
    const collected = await queryOne(`
      select 
        coalesce(sum(case when payment_method in ('cash', 'upi') then total else 0 end), 0) as total_collected
      from bills
      where bill_date = $1 and workspace = $2 and deleted_at is null
    `, [today, workspace]);

    return NextResponse.json({
      date: today,
      nextToken,
      totalCollected: collected?.total_collected || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
