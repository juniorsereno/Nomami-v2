import { NextResponse } from 'next/server';
import { processAsaasWebhook } from '@/lib/asaas/webhook-handler';

export async function POST(request: Request) {
  const body = await request.json();
  
  const result = await processAsaasWebhook(body);

  if (result.success) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  } else {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}