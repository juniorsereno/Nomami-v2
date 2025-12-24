/**
 * WhatsApp Cadence Messages Reorder API
 * 
 * PUT - Reorder cadence messages
 * 
 * Requirements: 7.2
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { z } from 'zod';
import { logger, logError } from '@/lib/logger';
import { CadenceMessage, ReorderRequest } from '@/lib/whatsapp/types';

// Validation schema for reorder request
const reorderSchema = z.object({
  messageIds: z.array(z.string().min(1)).min(1, 'Pelo menos um ID é necessário'),
});

/**
 * PUT /api/whatsapp/cadence/reorder
 * 
 * Reorders cadence messages based on the provided array of IDs
 * The order of IDs in the array determines the new order_number
 * 
 * Requirements: 7.2
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = reorderSchema.safeParse(body);

    if (!validation.success) {
      logger.warn({ errors: validation.error.flatten() }, 'Invalid reorder data');
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { messageIds }: ReorderRequest = validation.data;

    logger.info({ messageIds }, 'Reordering cadence messages');

    // Verify all IDs exist by checking each one
    const existingMessages = await sql`
      SELECT id FROM cadence_messages
      WHERE is_active = true
    `;
    
    const existingIds = new Set(existingMessages.map(m => m.id));
    const missingIds = messageIds.filter(id => !existingIds.has(id));
    
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: 'Algumas mensagens não foram encontradas', missingIds },
        { status: 400 }
      );
    }

    // Update order_number for each message using a transaction-like approach
    // First, set all to negative to avoid unique constraint issues
    for (let i = 0; i < messageIds.length; i++) {
      const tempOrder = -(i + 1);
      await sql`
        UPDATE cadence_messages
        SET order_number = ${tempOrder}, updated_at = NOW()
        WHERE id = ${messageIds[i]}::uuid
      `;
    }
    
    // Then set to final positive values
    for (let i = 0; i < messageIds.length; i++) {
      const newOrder = i + 1;
      await sql`
        UPDATE cadence_messages
        SET order_number = ${newOrder}, updated_at = NOW()
        WHERE id = ${messageIds[i]}::uuid
      `;
    }

    // Fetch updated messages
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

    logger.info({ count: messages.length }, 'Cadence messages reordered successfully');

    return NextResponse.json({ messages });
  } catch (error) {
    logError(error, 'Error reordering cadence messages');
    return NextResponse.json(
      { error: 'Erro ao reordenar mensagens de cadência' },
      { status: 500 }
    );
  }
}
