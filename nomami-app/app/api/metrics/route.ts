import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const activeSubscribersResult = await sql`SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`;
    const inactiveSubscribersResult = await sql`SELECT COUNT(*) FROM subscribers WHERE status = 'inativo'`;
    const mrrResult = await sql`
      SELECT
        SUM(value) as total_mrr
      FROM subscribers
      WHERE status = 'ativo' AND plan_type = 'mensal'
    `;
    const newSubscribersResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE start_date >= date_trunc('month', current_date)
    `;

    const activeSubscribers = parseInt(activeSubscribersResult[0]?.count ?? '0', 10);
    const inactiveSubscribers = parseInt(inactiveSubscribersResult[0]?.count ?? '0', 10);
    const mrr = parseFloat(mrrResult[0]?.total_mrr ?? '0');
    const newSubscribers = parseInt(newSubscribersResult[0]?.count ?? '0', 10);

    return NextResponse.json({
      activeSubscribers,
      inactiveSubscribers,
      mrr,
      newSubscribers,
    });
  } catch (error) {
    console.error('Erro na API de métricas:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}