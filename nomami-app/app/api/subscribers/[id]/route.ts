import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, cpf, status, next_due_date } = body;

    // Log the request for debugging
    logger.info({ id, body }, 'Updating subscriber');

    // Validate required fields - allow empty strings but not undefined
    if (name === undefined || email === undefined || status === undefined) {
      logger.error({ id, body }, 'Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: name, email, and status are required' 
      }, { status: 400 });
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone || null);
    }
    if (cpf !== undefined) {
      updates.push(`cpf = $${paramIndex++}`);
      values.push(cpf || null);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (next_due_date !== undefined && next_due_date !== null && next_due_date !== '') {
      updates.push(`next_due_date = $${paramIndex++}`);
      values.push(next_due_date);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add id to values
    values.push(id);

    const query = `
      UPDATE subscribers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    logger.info({ query, values }, 'Executing update query');

    const result = await sql.unsafe(query, values);

    if (result.length === 0) {
      logger.error({ id }, 'Subscriber not found');
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    logger.info({ id, subscriber: result[0] }, 'Subscriber updated successfully');
    return NextResponse.json(result[0]);
  } catch (error) {
    logger.error({ error, id: (await params).id }, 'Error updating subscriber');
    return NextResponse.json({ 
      error: 'Failed to update subscriber',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}