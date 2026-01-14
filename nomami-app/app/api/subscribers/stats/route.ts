import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET() {
  try {
    const activeSubscribersResult = await sql`SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`;

    const mrrResult = await sql`
      SELECT
        SUM(value) as total_mrr
      FROM subscribers
      WHERE status = 'ativo' AND plan_type = 'mensal'
    `;

    const newSubscribers7dResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE (start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '6 days')
      AND removed_at IS NULL
    `;

    const newSubscribers30dResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE (start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '29 days')
      AND removed_at IS NULL
    `;

    const newSubscribersTodayResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE (start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
      AND removed_at IS NULL
    `;

    const activeSubscribers = parseInt(activeSubscribersResult[0]?.count ?? '0', 10);
    const mrr = parseFloat(mrrResult[0]?.total_mrr ?? '0');
    const newSubscribers7d = parseInt(newSubscribers7dResult[0]?.count ?? '0', 10);
    const newSubscribers30d = parseInt(newSubscribers30dResult[0]?.count ?? '0', 10);
    const newSubscribersToday = parseInt(newSubscribersTodayResult[0]?.count ?? '0', 10);

    return NextResponse.json({
      activeSubscribers,
      mrr,
      newSubscribers7d,
      newSubscribers30d,
      newSubscribersToday,
    });
  } catch (error) {
    console.error('Erro na API de estatísticas de assinantes:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}