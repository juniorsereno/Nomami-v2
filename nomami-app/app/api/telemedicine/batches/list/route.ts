import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET() {
  try {
    const batches = await sql`
      SELECT
        b.id,
        b.batch_identifier,
        b.status,
        b.created_at,
        COUNT(c.id) as client_count
      FROM
        telemedicine_batches b
      LEFT JOIN
        telemedicine_clients c ON b.id = c.batch_id
      GROUP BY
        b.id
      ORDER BY
        b.created_at DESC;
    `;

    const clients = await sql`
      SELECT * FROM telemedicine_clients;
    `;

    const batchesWithClients = batches.map(batch => ({
      ...batch,
      clients: clients.filter(client => client.batch_id === batch.id)
    }));

    return NextResponse.json(batchesWithClients);
  } catch (error) {
    console.error('Erro na API de listagem de lotes de telemedicina:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}