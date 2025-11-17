import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET() {
  try {
    const activePartnersResult = await sql`SELECT COUNT(*) FROM parceiros WHERE ativo = true`;
    const inactivePartnersResult = await sql`SELECT COUNT(*) FROM parceiros WHERE ativo = false`;
    const newPartnersResult = await sql`
      SELECT COUNT(*)
      FROM parceiros
      WHERE created_at >= current_date - interval '30 days'
    `;

    const activePartners = parseInt(activePartnersResult[0]?.count ?? '0', 10);
    const inactivePartners = parseInt(inactivePartnersResult[0]?.count ?? '0', 10);
    const newPartners = parseInt(newPartnersResult[0]?.count ?? '0', 10);

    return NextResponse.json({
      activePartners,
      inactivePartners,
      newPartners,
    });
  } catch (error) {
    console.error('Erro na API de estatísticas de parceiros:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}