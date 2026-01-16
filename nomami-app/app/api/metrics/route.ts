import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { getCached, setCache } from '@/lib/cache';

const CACHE_KEY = 'dashboard-metrics';
const CACHE_TTL = 60; // 1 minuto

export async function GET() {
  try {
    // Tentar buscar do cache primeiro
    const cached = getCached<{
      activeSubscribers: number;
      inactiveSubscribers: number;
      mrr: number;
      newSubscribers: number;
    }>(CACHE_KEY);

    if (cached) {
      return NextResponse.json(cached);
    }

    // Executar queries em paralelo para melhor performance
    const [
      activeSubscribersResult,
      inactiveSubscribersResult,
      subscriberMrrResult,
      companyMrrResult,
      newSubscribersResult
    ] = await Promise.all([
      sql`SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`,
      sql`SELECT COUNT(*) FROM subscribers WHERE status = 'vencido'`,
      sql`
        SELECT COALESCE(SUM(value), 0) as total_mrr
        FROM subscribers
        WHERE status = 'ativo' 
          AND plan_type = 'mensal'
          AND COALESCE(subscriber_type, 'individual') = 'individual'
      `,
      sql`
        SELECT COALESCE(SUM(cp.contracted_quantity * cp.price_per_subscriber), 0) as total_mrr
        FROM company_plans cp
        INNER JOIN companies c ON c.id = cp.company_id
        WHERE cp.status = 'active' AND c.status = 'active'
      `,
      sql`
        SELECT COUNT(*)
        FROM subscribers
        WHERE start_date >= date_trunc('month', current_date)
      `
    ]);

    const subscriberMrr = parseFloat(subscriberMrrResult[0]?.total_mrr ?? '0');
    const companyMrr = parseFloat(companyMrrResult[0]?.total_mrr ?? '0');

    const metrics = {
      activeSubscribers: parseInt(activeSubscribersResult[0]?.count ?? '0', 10),
      inactiveSubscribers: parseInt(inactiveSubscribersResult[0]?.count ?? '0', 10),
      mrr: subscriberMrr + companyMrr,
      newSubscribers: parseInt(newSubscribersResult[0]?.count ?? '0', 10),
    };

    // Cachear resultado
    setCache(CACHE_KEY, metrics, CACHE_TTL);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Erro na API de métricas:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}