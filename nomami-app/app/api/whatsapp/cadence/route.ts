/**
 * WhatsApp Cadence Messages API
 * 
 * GET - List all active cadence messages ordered by order_number
 * POST - Create a new cadence message
 * 
 * Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 3.1
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { z } from 'zod';
import { logger, logError } from '@/lib/logger';
import { validateTextMessage, validateMediaUrl } from '@/lib/whatsapp/validation';
import { CadenceMessage, CreateMessageRequest } from '@/lib/whatsapp/types';

// Validation schema for creating a message
const createMessageSchema = z.object({
  type: z.enum(['text', 'image', 'video']),
  content: z.string().min(1, 'O conteúdo é obrigatório'),
  orderNumber: z.number().int().positive('A ordem deve ser um número positivo'),
});

/**
 * GET /api/whatsapp/cadence
 * 
 * Returns all active cadence messages ordered by order_number
 * Requirements: 1.6, 3.1
 */
export async function GET() {
  try {
    logger.info('Fetching cadence messages');

    const result = await sql`
      SELECT 
        id,
        type,
        content,
        order_number as "orderNumber",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cadence_messages
      WHERE is_active = true
      ORDER BY order_number ASC
    `;

    const messages: CadenceMessage[] = result.map(row => ({
      id: row.id,
      type: row.type,
      content: row.content,
      orderNumber: row.orderNumber,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));

    logger.info({ count: messages.length }, 'Cadence messages fetched successfully');

    return NextResponse.json({ messages });
  } catch (error) {
    logError(error, 'Error fetching cadence messages');
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens de cadência' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/cadence
 * 
 * Creates a new cadence message
 * Requirements: 1.5, 2.1, 2.2, 2.3
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createMessageSchema.safeParse(body);

    if (!validation.success) {
      logger.warn({ errors: validation.error.flatten() }, 'Invalid cadence message data');
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { type, content, orderNumber }: CreateMessageRequest = validation.data;

    // Validate content based on type
    if (type === 'text') {
      const textValidation = validateTextMessage(content);
      if (!textValidation.isValid) {
        return NextResponse.json(
          { error: textValidation.errors[0] },
          { status: 400 }
        );
      }
    } else {
      // image or video
      const urlValidation = validateMediaUrl(content);
      if (!urlValidation.isValid) {
        return NextResponse.json(
          { error: urlValidation.errors[0] },
          { status: 400 }
        );
      }
    }

    logger.info({ type, orderNumber }, 'Creating cadence message');

    // Check if order number already exists
    const existingOrder = await sql`
      SELECT id FROM cadence_messages
      WHERE order_number = ${orderNumber} AND is_active = true
    `;

    if (existingOrder.length > 0) {
      // Shift existing messages to make room
      await sql`
        UPDATE cadence_messages
        SET order_number = order_number + 1, updated_at = NOW()
        WHERE order_number >= ${orderNumber} AND is_active = true
      `;
    }

    const result = await sql`
      INSERT INTO cadence_messages (type, content, order_number, is_active, created_at, updated_at)
      VALUES (${type}, ${content}, ${orderNumber}, true, NOW(), NOW())
      RETURNING 
        id,
        type,
        content,
        order_number as "orderNumber",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const message: CadenceMessage = {
      id: result[0].id,
      type: result[0].type,
      content: result[0].content,
      orderNumber: result[0].orderNumber,
      isActive: result[0].isActive,
      createdAt: new Date(result[0].createdAt),
      updatedAt: new Date(result[0].updatedAt),
    };

    logger.info({ messageId: message.id }, 'Cadence message created successfully');

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    logError(error, 'Error creating cadence message');
    return NextResponse.json(
      { error: 'Erro ao criar mensagem de cadência' },
      { status: 500 }
    );
  }
}
