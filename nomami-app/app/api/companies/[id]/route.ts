/**
 * Company Detail API Routes
 * GET /api/companies/[id] - Get company details with plan and metrics
 * PUT /api/companies/[id] - Update company information
 * DELETE /api/companies/[id] - Soft delete company (set status to cancelled)
 * Requirements: 4.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById, updateCompany, deleteCompany, updateCompanyPlan } from '@/lib/companies/queries';
import { validateUpdateCompanyRequest, validateUpdatePlanRequest } from '@/lib/companies/validation';
import { logger, logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await getCompanyById(id);

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    logError(error, 'Erro ao buscar empresa');
    return NextResponse.json({ error: 'Erro ao buscar empresa.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validation = validateUpdateCompanyRequest(body);
    if (!validation.valid) {
      logger.warn({ errors: validation.errors }, 'Tentativa de atualização de empresa com dados inválidos');
      return NextResponse.json({
        error: 'Dados inválidos',
        details: validation.errors
      }, { status: 400 });
    }

    // Validate plan if present
    if (body.plan) {
      const planValidation = validateUpdatePlanRequest(body.plan);
      if (!planValidation.valid) {
        logger.warn({ errors: planValidation.errors }, 'Tentativa de atualização de plano com dados inválidos');
        return NextResponse.json({
          error: 'Dados do plano inválidos',
          details: planValidation.errors
        }, { status: 400 });
      }
    }

    logger.info({ companyId: id }, 'Atualizando empresa');

    const company = await updateCompany(id, body);

    let plan = null;
    if (body.plan) {
      logger.info({ companyId: id }, 'Atualizando plano da empresa');
      plan = await updateCompanyPlan(id, body.plan);
    }

    logger.info({ companyId: id }, 'Empresa atualizada com sucesso');

    return NextResponse.json({
      message: 'Empresa atualizada com sucesso!',
      company,
      plan,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    logError(error, 'Erro ao atualizar empresa');
    return NextResponse.json({ error: 'Erro ao atualizar empresa.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    logger.info({ companyId: id }, 'Cancelando empresa');

    await deleteCompany(id);

    logger.info({ companyId: id }, 'Empresa cancelada com sucesso');

    return NextResponse.json({
      message: 'Empresa cancelada com sucesso!',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    logError(error, 'Erro ao cancelar empresa');
    return NextResponse.json({ error: 'Erro ao cancelar empresa.' }, { status: 500 });
  }
}
