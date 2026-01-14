/**
 * Company Subscribers API Routes
 * GET /api/companies/[id]/subscribers - List company subscribers
 * POST /api/companies/[id]/subscribers - Add a corporate subscriber
 * Requirements: 3.1, 3.2, 5.4, 5.5, 5.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompanySubscribers, addCorporateSubscriber } from '@/lib/companies/subscriber-queries';
import { validateAddCorporateSubscriberRequest } from '@/lib/companies/validation';
import { logger, logError } from '@/lib/logger';
import type { SubscriberStatus } from '@/lib/companies/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') as SubscriberStatus | 'all' | null;
    const search = searchParams.get('search') || '';
    const includeRemoved = searchParams.get('includeRemoved') === 'true';

    const result = await getCompanySubscribers(id, {
      status: status || 'all',
      search,
      includeRemoved,
    });

    return NextResponse.json(result);
  } catch (error) {
    logError(error, 'Erro ao buscar colaboradores da empresa');
    return NextResponse.json({ error: 'Erro ao buscar colaboradores.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validation = validateAddCorporateSubscriberRequest(body);
    if (!validation.valid) {
      logger.warn({ errors: validation.errors }, 'Tentativa de adicionar colaborador com dados inválidos');
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.errors 
      }, { status: 400 });
    }

    logger.info({ companyId: id, name: body.name }, 'Adicionando colaborador corporativo');

    const result = await addCorporateSubscriber(id, body);

    logger.info({ 
      companyId: id, 
      subscriberId: result.subscriber.id,
      warning: result.warning 
    }, 'Colaborador adicionado com sucesso');

    return NextResponse.json({
      message: 'Colaborador adicionado com sucesso!',
      subscriber: result.subscriber,
      warning: result.warning === 'OVER_CONTRACTED_QUANTITY' 
        ? 'Quantidade de colaboradores ativos excede a quantidade contratada'
        : undefined,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'DUPLICATE_CPF':
          return NextResponse.json({ 
            error: 'CPF já cadastrado nesta empresa',
            code: 'DUPLICATE_CPF'
          }, { status: 409 });
        case 'COMPANY_NOT_FOUND':
          return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
        case 'COMPANY_CANCELLED':
          return NextResponse.json({ 
            error: 'Não é possível adicionar colaboradores a uma empresa cancelada',
            code: 'COMPANY_CANCELLED'
          }, { status: 400 });
      }
    }
    
    logError(error, 'Erro ao adicionar colaborador');
    return NextResponse.json({ error: 'Erro ao adicionar colaborador.' }, { status: 500 });
  }
}
