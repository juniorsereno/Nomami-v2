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
      mrrResult,
      newSubscribersResult
    ] = await Promise.all([
      sql`SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`,
      sql`SELECT COUNT(*) FROM subscribers WHERE status = 'vencido'`,
      sql`
        SELECT SUM(value) as total_mrr
        FROM subscribers
        WHERE status = 'ativo' AND plan_type = 'mensal'
      `,
      sql`
        SELECT COUNT(*)
        FROM subscribers
        WHERE start_date >= date_trunc('month', current_date)
      `
    ]);

    const metrics = {
      activeSubscribers: parseInt(activeSubscribersResult[0]?.count ?? '0', 10),
      inactiveSubscribers: parseInt(inactiveSubscribersResult[0]?.count ?? '0', 10),
      mrr: parseFloat(mrrResult[0]?.total_mrr ?? '0'),
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