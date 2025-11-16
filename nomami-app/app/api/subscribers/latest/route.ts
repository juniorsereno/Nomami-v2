import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const latestSubscribers = await sql`
      SELECT
        id,
        name,
        phone,
        cpf,
        start_date,
        next_due_date,
        plan_type
      FROM
        subscribers
      ORDER BY
        start_date DESC
      LIMIT 10
    `;

    return NextResponse.json(latestSubscribers);
  } catch (error) {
    console.error('Erro na API de últimos assinantes:', error);
    return NextResponse.json({ error: 'Erro ao buscar últimos assinantes.' }, { status: 500 });
  }
}