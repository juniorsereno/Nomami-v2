import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const plan = searchParams.get('plan');
    const dateRange = searchParams.get('dateRange');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
    const sort = searchParams.get('sort');
    const order = searchParams.get('order') === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * pageSize;

    const status = searchParams.get('status');

    const conditions = [];
    if (search) {
      const searchTerm = '%' + search + '%';
      conditions.push(sql`(name ILIKE ${searchTerm} OR phone ILIKE ${searchTerm})`);
    }
    if (plan) {
      conditions.push(sql`plan_type = ${plan}`);
    }
    if (status) {
      conditions.push(sql`status = ${status}`);
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

    let orderByClause = sql`ORDER BY name ASC`;
    if (sort === 'start_date') {
      orderByClause = order === 'DESC' ? sql`ORDER BY start_date DESC, created_at DESC` : sql`ORDER BY start_date ASC, created_at ASC`;
    } else if (sort === 'next_due_date') {
      orderByClause = order === 'DESC' ? sql`ORDER BY next_due_date DESC` : sql`ORDER BY next_due_date ASC`;
    } else if (sort === 'created_at') {
      orderByClause = order === 'DESC' ? sql`ORDER BY created_at DESC` : sql`ORDER BY created_at ASC`;
    }

    const subscribers = await sql`
      SELECT id, name, phone, email, cpf, plan_type, start_date, next_due_date, status, value, card_id
      FROM subscribers
      ${whereClause}
      ${orderByClause}
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