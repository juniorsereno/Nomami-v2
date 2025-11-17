import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET() {
  try {
    // MRR
    const mrrCurrentMonthResult = await sql`
      SELECT
        SUM(CASE
          WHEN plan_type = 'anual' THEN 500.0 / 12.0
          WHEN plan_type = 'mensal' THEN 50.0
          ELSE 0
        END) as total
      FROM subscribers
      WHERE status = 'ativo' AND start_date >= date_trunc('month', current_date)
    `;
    const mrrPreviousMonthResult = await sql`
      SELECT
        SUM(CASE
          WHEN plan_type = 'anual' THEN 500.0 / 12.0
          WHEN plan_type = 'mensal' THEN 50.0
          ELSE 0
        END) as total
      FROM subscribers
      WHERE status = 'ativo' AND start_date >= date_trunc('month', current_date - interval '1 month') AND start_date < date_trunc('month', current_date)
    `;

    // New Subscribers
    const newSubscribersCurrentMonthResult = await sql`
      SELECT COUNT(*) as total
      FROM subscribers
      WHERE start_date >= date_trunc('month', current_date)
    `;
    const newSubscribersPreviousMonthResult = await sql`
      SELECT COUNT(*) as total
      FROM subscribers
      WHERE start_date >= date_trunc('month', current_date - interval '1 month') AND start_date < date_trunc('month', current_date)
    `;

    const mrrCurrentMonth = mrrCurrentMonthResult[0]?.total ?? 0;
    const mrrPreviousMonth = mrrPreviousMonthResult[0]?.total ?? 0;
    const newSubscribersCurrentMonth = newSubscribersCurrentMonthResult[0]?.total ?? 0;
    const newSubscribersPreviousMonth = newSubscribersPreviousMonthResult[0]?.total ?? 0;

    const mrrVariation = mrrPreviousMonth > 0 ? ((mrrCurrentMonth - mrrPreviousMonth) / mrrPreviousMonth) * 100 : 100;
    const newSubscribersVariation = newSubscribersPreviousMonth > 0 ? ((newSubscribersCurrentMonth - newSubscribersPreviousMonth) / newSubscribersPreviousMonth) * 100 : 100;

    return NextResponse.json({
      mrrVariation,
      newSubscribersVariation,
    });
  } catch (error) {
    console.error('Erro na API de variações:', error);
    return NextResponse.json({ error: 'Erro ao buscar variações.' }, { status: 500 });
  }
}