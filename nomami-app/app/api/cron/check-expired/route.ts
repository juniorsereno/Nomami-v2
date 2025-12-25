import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(request: Request) {
  // Basic security check: verify a secret token if provided in headers
  // For Vercel Cron, the header 'Authorization' with 'Bearer <CRON_SECRET>' is standard
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    logger.info('Iniciando verificação de assinaturas expiradas (Cron Job)...');

    // Atualiza assinantes que estão 'ativo' mas com next_due_date no passado
    const result = await sql`
      UPDATE subscribers
      SET status = 'vencido', expired_at = NOW()
      WHERE status = 'ativo'
        AND next_due_date < CURRENT_DATE
      RETURNING id, name, email;
    `;

    const updatedCount = result.length;

    if (updatedCount > 0) {
      logger.info({ updatedCount, updatedSubscribers: result }, 'Assinaturas expiradas atualizadas para vencido.');
    } else {
      logger.info('Nenhuma assinatura expirada encontrada para atualização.');
    }

    return NextResponse.json({
      success: true,
      message: 'Verificação concluída.',
      updatedCount,
      updatedSubscribers: result.map(s => ({ id: s.id, name: s.name }))
    });

  } catch (error) {
    logger.error({ err: error }, 'Erro ao executar Cron Job de verificação de expirados');
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao processar cron job.'
    }, { status: 500 });
  }
}