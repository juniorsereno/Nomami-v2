import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { processStripeWebhook, StripeWebhookEvent } from '@/lib/stripe/webhook-handler';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const { logId } = await request.json();

  if (!logId) {
    return NextResponse.json({ error: 'Log ID é obrigatório' }, { status: 400 });
  }

  try {
    // 1. Buscar o log original no banco de dados
    const logResult = await sql`
      SELECT request_body FROM stripe_webhook_logs WHERE id = ${logId}
    `;

    if (logResult.length === 0) {
      return NextResponse.json({ error: 'Log não encontrado' }, { status: 404 });
    }

    const log = logResult[0];
    const requestBody = log.request_body as StripeWebhookEvent;

    logger.info({ logId, requestBody }, `Iniciando reprocessamento do log Stripe ID: ${logId}`);

    // 2. Chamar a lógica de processamento com o corpo do log
    const result = await processStripeWebhook(requestBody);

    // 3. Retornar o resultado do reprocessamento
    if (result.success) {
      return NextResponse.json({ message: `Reprocessamento concluído com sucesso: ${result.message}` }, { status: result.status });
    } else {
      return NextResponse.json({ error: `Falha no reprocessamento: ${result.error}` }, { status: result.status });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido durante o reprocessamento.';
    logger.error({ err: error, logId }, `Exceção ao reprocessar o log ID: ${logId}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
