/**
 * Companies API Routes
 * GET /api/companies - List all companies with metrics
 * POST /api/companies - Create a new company with plan
 * Requirements: 1.1, 1.2, 1.3, 4.4, 4.6, 9.1, 9.2
 */

import { NextResponse } from 'next/server';
import { getCompanies, createCompany } from '@/lib/companies/queries';
import { validateCreateCompanyRequest } from '@/lib/companies/validation';
import { logger, logError } from '@/lib/logger';

export async function GET() {
  try {
    const companies = await getCompanies();
    
    return NextResponse.json({
      data: companies,
      total: companies.length,
    });
  } catch (error) {
    logError(error, 'Erro ao buscar empresas');
    return NextResponse.json({ error: 'Erro ao buscar empresas.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = validateCreateCompanyRequest(body);
    if (!validation.valid) {
      logger.warn({ errors: validation.errors }, 'Tentativa de criação de empresa com dados inválidos');
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.errors 
      }, { status: 400 });
    }

    logger.info({ name: body.name, cnpj: body.cnpj }, 'Criando nova empresa');

    const result = await createCompany(body);

    logger.info({ companyId: result.company.id }, 'Empresa criada com sucesso');

    return NextResponse.json({
      message: 'Empresa criada com sucesso!',
      company: result.company,
      plan: result.plan,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_CNPJ') {
      return NextResponse.json({ 
        error: 'CNPJ já cadastrado',
        code: 'DUPLICATE_CNPJ'
      }, { status: 409 });
    }
    
    logError(error, 'Erro ao criar empresa');
    return NextResponse.json({ error: 'Erro ao criar empresa.' }, { status: 500 });
  }
}
