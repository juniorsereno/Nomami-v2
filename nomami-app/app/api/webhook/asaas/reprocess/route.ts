import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import https from 'https';

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
    
    // Workaround para Next.js/Node fetch com self-signed certs em desenvolvimento:
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Restaurar a segurança após a chamada (opcional, mas boa prática se o processo for persistente)
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }

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