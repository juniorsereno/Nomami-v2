import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const plan = searchParams.get('plan');
    const dateRange = searchParams.get('dateRange');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (search) {
      const searchTerm = '%' + search + '%';
      conditions.push(sql`(name ILIKE ${searchTerm} OR phone ILIKE ${searchTerm})`);
    }
    if (plan) {
      conditions.push(sql`plan_type = ${plan}`);
    }
    if (dateRange) {
      switch (dateRange) {
        case 'today':
          conditions.push(sql`(start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')`);
          break;
        case '7d':
          conditions.push(sql`(start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '6 days')`);
          break;
        case '15d':
          conditions.push(sql`(start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '14 days')`);
          break;
        case '30d':
          conditions.push(sql`(start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '29 days')`);
          break;
      }
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}`
      : sql``;

    const countResult = await sql`
      SELECT COUNT(*) FROM subscribers ${whereClause}
    `;
    const totalRecords = parseInt(countResult[0]?.count ?? '0', 10);

    const subscribers = await sql`
      SELECT id, name, phone, email, cpf, plan_type, start_date, next_due_date, status, value
      FROM subscribers
      ${whereClause}
      ORDER BY name ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    return NextResponse.json({
      data: subscribers,
      total: totalRecords,
    });
  } catch (error) {
    console.error('Erro na API de listagem de assinantes:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}