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
    const subscriberType = searchParams.get('subscriberType'); // 'individual', 'corporate', or null for all

    const conditions = [];
    if (search) {
      const searchTerm = '%' + search + '%';
      conditions.push(sql`(s.name ILIKE ${searchTerm} OR s.phone ILIKE ${searchTerm} OR s.cpf ILIKE ${searchTerm} OR s.card_id ILIKE ${searchTerm})`);
    }

    // Always exclude soft-deleted subscribers
    conditions.push(sql`s.removed_at IS NULL`);

    if (plan) {
      conditions.push(sql`s.plan_type = ${plan}`);
    }
    if (status) {
      conditions.push(sql`LOWER(TRIM(s.status)) = LOWER(${status})`);
    }
    if (subscriberType) {
      conditions.push(sql`COALESCE(s.subscriber_type, 'individual') = ${subscriberType}`);
    }
    if (dateRange) {
      // Escolhe a coluna de data baseado no status:
      // - 'vencido': usa expired_at (data de vencimento) - TEM timezone
      // - 'ativo': usa start_date (data de início) - SEM timezone
      // - sem filtro (all): usa created_at (data de criação) - TEM timezone
      
      switch (dateRange) {
        case 'today':
          if (status === 'vencido') {
            conditions.push(sql`(s.expired_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')`);
          } else if (status === 'ativo') {
            conditions.push(sql`s.start_date >= CURRENT_DATE`);
          } else {
            conditions.push(sql`(s.created_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')`);
          }
          break;
        case '7d':
          if (status === 'vencido') {
            conditions.push(sql`(s.expired_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '6 days')`);
          } else if (status === 'ativo') {
            conditions.push(sql`s.start_date >= CURRENT_DATE - INTERVAL '6 days'`);
          } else {
            conditions.push(sql`(s.created_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '6 days')`);
          }
          break;
        case '15d':
          if (status === 'vencido') {
            conditions.push(sql`(s.expired_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '14 days')`);
          } else if (status === 'ativo') {
            conditions.push(sql`s.start_date >= CURRENT_DATE - INTERVAL '14 days'`);
          } else {
            conditions.push(sql`(s.created_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '14 days')`);
          }
          break;
        case '30d':
          if (status === 'vencido') {
            conditions.push(sql`(s.expired_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '29 days')`);
          } else if (status === 'ativo') {
            conditions.push(sql`s.start_date >= CURRENT_DATE - INTERVAL '29 days'`);
          } else {
            conditions.push(sql`(s.created_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '29 days')`);
          }
          break;
      }
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}`
      : sql``;

    let orderByClause = sql`ORDER BY s.name ASC`;
    if (sort === 'start_date') {
      orderByClause = order === 'DESC' ? sql`ORDER BY s.start_date DESC, s.created_at DESC` : sql`ORDER BY s.start_date ASC, s.created_at ASC`;
    } else if (sort === 'next_due_date') {
      orderByClause = order === 'DESC' ? sql`ORDER BY s.next_due_date DESC` : sql`ORDER BY s.next_due_date ASC`;
    } else if (sort === 'created_at') {
      orderByClause = order === 'DESC' ? sql`ORDER BY s.created_at DESC` : sql`ORDER BY s.created_at ASC`;
    }

    // Executar count e data em paralelo
    const [countResult, subscribers] = await Promise.all([
      sql`SELECT COUNT(*) FROM subscribers s ${whereClause}`,
      sql`
        SELECT 
          s.id, 
          s.name, 
          s.phone, 
          s.email, 
          s.cpf, 
          s.plan_type, 
          s.start_date, 
          s.next_due_date, 
          s.status, 
          s.value, 
          s.card_id,
          COALESCE(s.subscriber_type, 'individual') as subscriber_type,
          s.company_id,
          c.name as company_name
        FROM subscribers s
        LEFT JOIN companies c ON c.id = s.company_id
        ${whereClause}
        ${orderByClause}
        LIMIT ${pageSize}
        OFFSET ${offset}
      `
    ]);

    const totalRecords = parseInt(countResult[0]?.count ?? '0', 10);

    return NextResponse.json({
      data: subscribers,
      total: totalRecords,
    });
  } catch (error) {
    console.error('Erro na API de listagem de assinantes:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}