import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { logError } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let logs;
    
    if (batchId) {
      // Busca logs de um lote específico
      logs = await sql`
        SELECT 
          l.*,
          b.batch_identifier
        FROM telemedicine_api_logs l
        LEFT JOIN telemedicine_batches b ON l.batch_id = b.id
        WHERE l.batch_id = ${batchId}
        ORDER BY l.created_at DESC;
      `;
    } else {
      // Busca todos os logs com limite
      logs = await sql`
        SELECT 
          l.*,
          b.batch_identifier
        FROM telemedicine_api_logs l
        LEFT JOIN telemedicine_batches b ON l.batch_id = b.id
        ORDER BY l.created_at DESC
        LIMIT ${limit};
      `;
    }

    return NextResponse.json({ logs });
  } catch (error) {
    logError(error, 'Erro ao buscar logs da API de telemedicina');
    return NextResponse.json(
      { error: 'Erro ao buscar logs' },
      { status: 500 }
    );
  }
}
