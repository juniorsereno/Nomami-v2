import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payload } = body;

    if (!payload) {
      return NextResponse.json({ error: 'Payload não fornecido.' }, { status: 400 });
    }

    logger.info({ payload }, 'Reprocessando webhook Asaas manualmente');

    // Reenvia o payload para o endpoint principal do webhook
    // Usamos a URL completa do próprio servidor para garantir que o fluxo seja idêntico
    const webhookUrl = new URL('/api/webhook/asaas', request.url);
    
    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao reprocessar: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    logger.error({ err: error }, 'Erro ao reprocessar webhook Asaas');
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao reprocessar.' 
    }, { status: 500 });
  }
}