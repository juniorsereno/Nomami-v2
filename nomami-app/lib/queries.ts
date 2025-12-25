import sql from './db-pool';

// Exemplo de uma função de busca de dados para o Dashboard
export async function getDashboardMetrics() {
  try {
    const activeSubscribersResult = await sql`SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`;
    const mrrResult = await sql`
      SELECT SUM(value) as total_mrr
      FROM subscribers
      WHERE status = 'ativo' AND plan_type = 'mensal'
    `;
    const newSubscribersResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE start_date >= date_trunc('month', current_date)
    `;
    const expiredThisMonthResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE status = 'vencido'
        AND (expired_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
    `;

    const metrics = {
      activeSubscribers: parseInt(activeSubscribersResult[0]?.count ?? '0', 10),
      mrr: parseFloat(mrrResult[0]?.total_mrr ?? '0'),
      newSubscribers: parseInt(newSubscribersResult[0]?.count ?? '0', 10),
      expiredThisMonth: parseInt(expiredThisMonthResult[0]?.count ?? '0', 10),
    };
    return metrics;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch dashboard metrics.');
  }
}

export async function getLatestSubscribers(limit = 10) {
  try {
    const data = await sql`
      SELECT id, name, phone, cpf, start_date, next_due_date, plan_type
      FROM subscribers
      ORDER BY start_date DESC
      LIMIT ${limit}
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch latest subscribers.');
  }
}

export async function getSubscriberStats() {
  try {
    const activeSubscribersResult = await sql`SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`;
    const mrrResult = await sql`
      SELECT SUM(value) as total_mrr
      FROM subscribers
      WHERE status = 'ativo' AND plan_type = 'mensal'
    `;
    const newSubscribers30dResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE (start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '29 days')
    `;
    const newSubscribersTodayResult = await sql`
      SELECT COUNT(*)
      FROM subscribers
      WHERE (start_date AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
    `;

    const stats = {
      activeSubscribers: parseInt(activeSubscribersResult[0]?.count ?? '0', 10),
      mrr: parseFloat(mrrResult[0]?.total_mrr ?? '0'),
      newSubscribers30d: parseInt(newSubscribers30dResult[0]?.count ?? '0', 10),
      newSubscribersToday: parseInt(newSubscribersTodayResult[0]?.count ?? '0', 10),
    };
    return stats;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch subscriber stats.');
  }
}

export async function getSubscribers({ page = 1, pageSize = 20, search = '', plan = 'all', dateRange = 'all', status = 'all' }) {
  try {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    if (search) {
      const searchTerm = '%' + search + '%';
      conditions.push(sql`(name ILIKE ${searchTerm} OR phone ILIKE ${searchTerm})`);
    }
    if (plan !== 'all') {
      conditions.push(sql`plan_type = ${plan}`);
    }
    if (status !== 'all') {
      conditions.push(sql`status = ${status}`);
    }
    if (dateRange !== 'all') {
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
      SELECT id, name, phone, email, cpf, plan_type, start_date, next_due_date, status, value, card_id
      FROM subscribers
      ${whereClause}
      ORDER BY name ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    return { data: subscribers, total: totalRecords };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch subscribers.');
  }
}

export async function getPartnerStats() {
  try {
    const activePartnersResult = await sql`SELECT COUNT(*) FROM parceiros WHERE ativo = true`;
    const inactivePartnersResult = await sql`SELECT COUNT(*) FROM parceiros WHERE ativo = false`;
    const newPartnersResult = await sql`
      SELECT COUNT(*)
      FROM parceiros
      WHERE created_at >= current_date - interval '30 days'
    `;

    const stats = {
      activePartners: parseInt(activePartnersResult[0]?.count ?? '0', 10),
      inactivePartners: parseInt(inactivePartnersResult[0]?.count ?? '0', 10),
      newPartners: parseInt(newPartnersResult[0]?.count ?? '0', 10),
    };
    return stats;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch partner stats.');
  }
}

export async function getPartners() {
  try {
    const partners = await sql`
      SELECT
        p.id,
        p.nome as company_name,
        p.cnpj,
        p.telefone as phone,
        CASE WHEN p.ativo THEN 'Ativo' ELSE 'Inativo' END as status,
        p.created_at as entry_date,
        p.beneficio as benefit_description,
        p.endereco as address,
        p.categoria as category,
        p.logo_url,
        p.site_url,
        p.instagram_url
      FROM
        parceiros p
      ORDER BY
        p.nome ASC
    `;
    return partners;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch partners.');
  }
}

export async function getSubscriberByCpf(cpf: string) {
  try {
    const subscribers = await sql`
      SELECT id, name, cpf, next_due_date, status, plan_type
      FROM subscribers
      WHERE cpf = ${cpf}
      LIMIT 1
    `;

    return subscribers[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch subscriber by CPF.');
  }
}

export async function getSubscriberByCardId(cardId: string) {
  try {
    const subscribers = await sql`
      SELECT id, name, card_id, next_due_date, status, plan_type
      FROM subscribers
      WHERE card_id = ${cardId}
      LIMIT 1
    `;

    return subscribers[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch subscriber by card ID.');
  }
}