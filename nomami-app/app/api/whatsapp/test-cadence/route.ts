/**
 * Test Cadence API - TEMPORARY FOR TESTING
 * 
 * POST - Execute cadence directly for testing
 * 
 * DELETE THIS FILE AFTER TESTING
 */

import { NextResponse } from 'next/server';
import { executeCadence, SubscriberInfo } from '@/lib/whatsapp/cadence-service';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, phone } = body;
    
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'name e phone são obrigatórios' },
        { status: 400 }
      );
    }

    logger.info({ name, phone }, 'Starting direct cadence test');

    const subscriberInfo: SubscriberInfo = {
      id: 'test-' + Date.now(),
      name,
      phone,
      subscriptionDate: new Date().toISOString(),
    };

    const result = await executeCadence(subscriberInfo);

    logger.info({ result }, 'Cadence test completed');

    return NextResponse.json({
      success: result.success,
      messagesSucceeded: result.messagesSucceeded,
      messagesFailed: result.messagesFailed,
      errors: result.errors,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error({ error, errorMessage }, 'Error in test cadence');
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
