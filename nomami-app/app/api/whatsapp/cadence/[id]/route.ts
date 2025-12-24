/**
 * WhatsApp Cadence Message API - Single Message Operations
 * 
 * PUT - Update a cadence message
 * DELETE - Delete a cadence message
 * 
 * Requirements: 1.7, 1.8
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { z } from 'zod';
import { logger, logError } from '@/lib/logger';
import { validateTextMessage, validateMediaUrl } from '@/lib/whatsapp/validation';
import { CadenceMessage, UpdateMessageRequest } from '@/lib/whatsapp/types';

// Validation schema for updating a message
const updateMessageSchema = z.object({
  type: z.enum(['text', 'image', 'video']).optional(),
  content: z.string().min(1, 'O conteúdo é obrigatório').optional(),
  orderNumber: z.number().int().positive('A ordem deve ser um número positivo').optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/whatsapp/cadence/[id]
 * 
 * Updates an existing cadence message
 * Requirements: 1.7
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateMessageSchema.safeParse(body);

    if (!validation.success) {
      logger.warn({ errors: validation.error.flatten() }, 'Invalid update data');
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updates: UpdateMessageRequest = validation.data;

    // Check if message exists
    const existing = await sql`
      SELECT id, type, content FROM cadence_messages WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    // Determine the type to validate against
    const typeToValidate = updates.type || existing[0].type;
    const contentToValidate = updates.content || existing[0].content;

    // Validate content if type or content is being updated
    if (updates.type || updates.content) {
      if (typeToValidate === 'text') {
        const textValidation = validateTextMessage(contentToValidate);
        if (!textValidation.isValid) {
          return NextResponse.json(
            { error: textValidation.errors[0] },
            { status: 400 }
          );
        }
      } else {
        const urlValidation = validateMediaUrl(contentToValidate);
        if (!urlValidation.isValid) {
          return NextResponse.json(
            { error: urlValidation.errors[0] },
            { status: 400 }
          );
        }
      }
    }

    logger.info({ messageId: id, updates }, 'Updating cadence message');

    // Build dynamic update query
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: (string | number | boolean)[] = [];

    if (updates.type !== undefined) {
      values.push(updates.type);
      setClauses.push(`type = $${values.length}`);
    }
    if (updates.content !== undefined) {
      values.push(updates.content);
      setClauses.push(`content = $${values.length}`);
    }
    if (updates.orderNumber !== undefined) {
      values.push(updates.orderNumber);
      setClauses.push(`order_number = $${values.length}`);
    }
    if (updates.isActive !== undefined) {
      values.push(updates.isActive);
      setClauses.push(`is_active = $${values.length}`);
    }

    // Use a simpler approach with individual updates
    if (updates.type !== undefined) {
      await sql`UPDATE cadence_messages SET type = ${updates.type}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (updates.content !== undefined) {
      await sql`UPDATE cadence_messages SET content = ${updates.content}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (updates.orderNumber !== undefined) {
      await sql`UPDATE cadence_messages SET order_number = ${updates.orderNumber}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (updates.isActive !== undefined) {
      await sql`UPDATE cadence_messages SET is_active = ${updates.isActive}, updated_at = NOW() WHERE id = ${id}`;
    }

    // Fetch updated message
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
      WHERE id = ${id}
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

    logger.info({ messageId: id }, 'Cadence message updated successfully');

    return NextResponse.json({ message });
  } catch (error) {
    logError(error, 'Error updating cadence message');
    return NextResponse.json(
      { error: 'Erro ao atualizar mensagem de cadência' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/cadence/[id]
 * 
 * Deletes a cadence message and reorders remaining messages
 * Requirements: 1.8
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if message exists and get its order
    const existing = await sql`
      SELECT id, order_number FROM cadence_messages WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    const deletedOrder = existing[0].order_number;

    logger.info({ messageId: id, order: deletedOrder }, 'Deleting cadence message');

    // Delete the message
    await sql`DELETE FROM cadence_messages WHERE id = ${id}`;

    // Reorder remaining messages to fill the gap
    await sql`
      UPDATE cadence_messages
      SET order_number = order_number - 1, updated_at = NOW()
      WHERE order_number > ${deletedOrder} AND is_active = true
    `;

    logger.info({ messageId: id }, 'Cadence message deleted and remaining messages reordered');

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError(error, 'Error deleting cadence message');
    return NextResponse.json(
      { error: 'Erro ao excluir mensagem de cadência' },
      { status: 500 }
    );
  }
}
