import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET() {
  try {
    const [result] = await sql`
      SELECT COUNT(*) FROM parceiros WHERE ativo = true;
    `;
    const activePartners = result.count;
    return NextResponse.json({ activePartners });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch active partners' }, { status: 500 });
  }
}