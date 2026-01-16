import { NextRequest, NextResponse } from 'next/server';
import { getSubscriberByCardId } from '@/lib/queries';
import { validateSubscriberStatus } from '@/lib/subscriber-validation';

/**
 * GET /api/consulta
 * 
 * Public API endpoint to query subscriber status by card_id
 * 
 * Query Parameters:
 * - card_id: The subscriber's card ID (required)
 * 
 * Returns:
 * - 200: Subscriber found with status information
 * - 400: Invalid or missing card_id
 * - 404: Subscriber not found
 * - 500: Database error
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cardId = searchParams.get('card_id');

    console.log('[API /api/consulta] Received request with card_id:', cardId);

    // Validate card_id parameter
    if (!cardId || cardId.trim() === '') {
      console.log('[API /api/consulta] Invalid card_id - empty or null');
      return NextResponse.json(
        { error: 'Card ID inválido' },
        { status: 400 }
      );
    }

    console.log('[API /api/consulta] Fetching subscriber with card_id:', cardId.trim());

    // Fetch subscriber from database
    const subscriber = await getSubscriberByCardId(cardId.trim());

    console.log('[API /api/consulta] Subscriber found:', !!subscriber);

    // Check if subscriber exists
    if (!subscriber) {
      console.log('[API /api/consulta] Subscriber not found for card_id:', cardId.trim());
      return NextResponse.json(
        { error: 'Carteirinha não encontrada' },
        { status: 404 }
      );
    }

    console.log('[API /api/consulta] Validating subscriber status');

    // Validate subscriber status
    const statusValidation = validateSubscriberStatus({
      id: subscriber.id,
      name: subscriber.name,
      card_id: subscriber.card_id,
      next_due_date: subscriber.next_due_date,
      status: subscriber.status,
      plan_type: subscriber.plan_type,
      subscriber_type: subscriber.subscriber_type,
      company_id: subscriber.company_id,
      company_name: subscriber.company_name,
      removed_at: subscriber.removed_at
    });

    console.log('[API /api/consulta] Status validation result:', statusValidation);

    // Return subscriber data with active status
    return NextResponse.json({
      name: subscriber.name,
      card_id: subscriber.card_id,
      status: subscriber.status,
      next_due_date: subscriber.next_due_date,
      subscriber_type: subscriber.subscriber_type,
      company_name: subscriber.company_name || undefined,
      isActive: statusValidation.isActive
    }, { status: 200 });

  } catch (error) {
    console.error('[API /api/consulta] Error fetching subscriber:', error);
    console.error('[API /api/consulta] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Erro ao buscar assinante' },
      { status: 500 }
    );
  }
}
