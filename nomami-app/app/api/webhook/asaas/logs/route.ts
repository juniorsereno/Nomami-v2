import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET() {
  try {
    // Limpa logs com mais de 30 dias
    await sql`
      DELETE FROM asaas_webhook_logs
      WHERE received_at < NOW() - INTERVAL '30 days'
    `;

    const logs = await sql`
      SELECT id, received_at, request_body, error_message, status
      FROM asaas_webhook_logs
      ORDER BY received_at DESC
    `;

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Erro na API de listagem de logs do Asaas:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}