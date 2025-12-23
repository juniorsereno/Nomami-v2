import { NextResponse } from 'next/server';
import { processStripeWebhook } from '@/lib/stripe/webhook-handler';

export async function POST(request: Request) {
  const body = await request.json();
  
  const result = await processStripeWebhook(body);

  if (result.success) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  } else {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
