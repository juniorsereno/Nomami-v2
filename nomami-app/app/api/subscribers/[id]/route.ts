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

    // Update with all fields, using null for optional empty fields
    const result = await sql`
      UPDATE subscribers
      SET 
        name = ${name}, 
        email = ${email}, 
        phone = ${phone || null}, 
        cpf = ${cpf || null}, 
        status = ${status},
        next_due_date = ${next_due_date || null}
      WHERE id = ${id}
      RETURNING *;
    `;

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