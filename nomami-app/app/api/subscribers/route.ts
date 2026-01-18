import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, cpf, plan_type, start_date, next_due_date, value } = body;

    // Validate required fields
    if (!name || !email || !start_date || !next_due_date) {
      logger.error({ body }, 'Missing required fields for subscriber creation');
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, e-mail, data de entrada e data de vencimento' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSubscriber = await sql`
      SELECT id FROM subscribers WHERE email = ${email} LIMIT 1
    `;

    if (existingSubscriber.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um assinante com este e-mail' },
        { status: 409 }
      );
    }

    // Generate unique card_id (8 character hex string)
    const cardId = Math.random().toString(16).substring(2, 10).toUpperCase();

    // Create subscriber
    const result = await sql`
      INSERT INTO subscribers (
        name,
        email,
        phone,
        cpf,
        plan_type,
        start_date,
        next_due_date,
        status,
        value,
        card_id,
        subscriber_type,
        created_at
      )
      VALUES (
        ${name},
        ${email},
        ${phone || null},
        ${cpf || null},
        ${plan_type || 'mensal'},
        ${start_date},
        ${next_due_date},
        'ativo',
        ${value || null},
        ${cardId},
        'individual',
        NOW()
      )
      RETURNING *;
    `;

    logger.info({ 
      subscriberId: result[0].id, 
      email, 
      cardId 
    }, 'Manual subscriber created successfully');

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    logger.error({ error }, 'Error creating manual subscriber');
    return NextResponse.json(
      { 
        error: 'Erro ao criar assinante',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
