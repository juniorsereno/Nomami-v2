/**
 * Company Stats API Route
 * GET /api/companies/stats - Get corporate statistics
 * Requirements: 4.1, 4.2, 4.3
 */

import { NextResponse } from 'next/server';
import { getCompanyStats } from '@/lib/companies/queries';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const stats = await getCompanyStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logError(error, 'Erro ao buscar estatísticas de empresas');
    return NextResponse.json({ error: 'Erro ao buscar estatísticas.' }, { status: 500 });
  }
}
