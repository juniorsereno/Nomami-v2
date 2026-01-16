import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    }

    const emailNormalized = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return NextResponse.json(
        { error: 'E-mail inválido' },
        { status: 400 }
      );
    }

    // Search subscriber by email
    const result = await sql`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.cpf,
        s.card_id,
        s.next_due_date,
        s.plan_type,
        s.status,
        s.subscriber_type,
        s.company_id,
        s.removed_at,
        c.name as company_name
      FROM subscribers s
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE LOWER(s.email) = ${emailNormalized}
      LIMIT 1
    `;

    if (result.length === 0) {
      logger.info({ email: emailNormalized }, 'Card lookup: email not found');
      return NextResponse.json(
        { error: 'Nenhuma assinatura encontrada para este e-mail' },
        { status: 404 }
      );
    }

    const subscriber = result[0];

    // Check if subscriber is active
    const isRemoved = subscriber.removed_at !== null;
    const isInactive = subscriber.status === 'inativo';
    const isExpired = subscriber.next_due_date && new Date(subscriber.next_due_date) < new Date();

    if (isRemoved || isInactive) {
      logger.info({ email: emailNormalized, status: subscriber.status }, 'Card lookup: subscriber inactive');
      return NextResponse.json(
        { error: 'Sua assinatura está inativa. Entre em contato para reativar.' },
        { status: 403 }
      );
    }

    if (isExpired) {
      logger.info({ email: emailNormalized, nextDueDate: subscriber.next_due_date }, 'Card lookup: subscription expired');
      return NextResponse.json(
        { error: 'Sua assinatura está vencida. Renove para acessar sua carteirinha.' },
        { status: 403 }
      );
    }

    logger.info({ email: emailNormalized, cardId: subscriber.card_id }, 'Card lookup: success');

    return NextResponse.json({
      subscriber: {
        name: subscriber.name,
        card_id: subscriber.card_id,
        next_due_date: subscriber.next_due_date,
        plan_type: subscriber.plan_type,
        subscriber_type: subscriber.subscriber_type || 'individual',
        company_name: subscriber.company_name,
        status: subscriber.status,
      }
    });

  } catch (error) {
    logger.error({ error }, 'Error in minha-carteirinha API');
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
