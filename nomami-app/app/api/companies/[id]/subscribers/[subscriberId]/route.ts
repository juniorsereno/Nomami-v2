/**
 * Company Subscriber Detail API Routes
 * DELETE /api/companies/[id]/subscribers/[subscriberId] - Remove a corporate subscriber (soft delete)
 * Requirements: 3.6, 3.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { removeCorporateSubscriber } from '@/lib/companies/subscriber-queries';
import { logger, logError } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subscriberId: string }> }
) {
  try {
    const { id, subscriberId } = await params;

    logger.info({ companyId: id, subscriberId }, 'Removendo colaborador corporativo');

    const subscriber = await removeCorporateSubscriber(id, subscriberId);

    logger.info({ companyId: id, subscriberId }, 'Colaborador removido com sucesso');

    return NextResponse.json({
      message: 'Colaborador removido com sucesso!',
      subscriber,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'SUBSCRIBER_NOT_FOUND':
          return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
        case 'SUBSCRIBER_ALREADY_INACTIVE':
          return NextResponse.json({ 
            error: 'Colaborador já está inativo',
            code: 'SUBSCRIBER_ALREADY_INACTIVE'
          }, { status: 400 });
      }
    }
    
    logError(error, 'Erro ao remover colaborador');
    return NextResponse.json({ error: 'Erro ao remover colaborador.' }, { status: 500 });
  }
}
