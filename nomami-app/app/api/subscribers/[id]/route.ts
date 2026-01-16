import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, cpf, status, next_due_date } = body;

    if (!name || !email || !phone || !cpf || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Se next_due_date foi fornecido, inclui na atualização
    const result = next_due_date 
      ? await sql`
          UPDATE subscribers
          SET name = ${name}, 
              email = ${email}, 
              phone = ${phone}, 
              cpf = ${cpf}, 
              status = ${status},
              next_due_date = ${next_due_date}
          WHERE id = ${id}
          RETURNING *;
        `
      : await sql`
          UPDATE subscribers
          SET name = ${name}, 
              email = ${email}, 
              phone = ${phone}, 
              cpf = ${cpf}, 
              status = ${status}
          WHERE id = ${id}
          RETURNING *;
        `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
  }
}