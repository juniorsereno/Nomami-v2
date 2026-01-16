import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const historicalData = await sql`
      WITH date_series AS (
        SELECT generate_series(
          (current_date - interval '29 days')::date,
          current_date::date,
          '1 day'::interval
        )::date AS day
      )
      SELECT
        d.day AS date,
        (SELECT COUNT(*)
           FROM subscribers s
           WHERE s.start_date::date <= d.day
             AND s.status = 'ativo'
             AND COALESCE(s.subscriber_type, 'individual') = 'individual'
          ) AS active_subscribers,
        (SELECT COUNT(*)
           FROM subscribers s
           WHERE s.start_date::date = d.day
             AND COALESCE(s.subscriber_type, 'individual') = 'individual'
          ) AS new_subscribers,
        (SELECT COUNT(*)
           FROM subscribers s
           WHERE (s.expired_at AT TIME ZONE 'America/Sao_Paulo')::date = d.day
             AND COALESCE(s.subscriber_type, 'individual') = 'individual'
          ) AS expired_subscribers
        FROM date_series d
        ORDER BY d.day ASC;
    `;

    const formattedData = historicalData.map(item => ({
      date: item.date,
      active_subscribers: parseInt(item.active_subscribers, 10),
      new_subscribers: parseInt(item.new_subscribers, 10),
      expired_subscribers: parseInt(item.expired_subscribers, 10)
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Erro na API de dados históricos:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados históricos.' }, { status: 500 });
  }
}