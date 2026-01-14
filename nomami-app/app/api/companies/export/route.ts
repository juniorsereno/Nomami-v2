/**
 * Companies Export API Route
 * GET /api/companies/export - Export companies list as CSV
 * Requirements: 10.1, 10.2
 */

import { NextResponse } from 'next/server';
import { getCompanies } from '@/lib/companies/queries';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const companies = await getCompanies();
    
    // CSV header
    const headers = [
      'Nome',
      'CNPJ',
      'Email de Contato',
      'Telefone de Contato',
      'Pessoa de Contato',
      'Status',
      'Quantidade Contratada',
      'Colaboradores Ativos',
      'Valor Mensal',
      'Data de Criação',
    ];

    // CSV rows
    const rows = companies.map(company => [
      escapeCsvField(company.name),
      formatCnpj(company.cnpj),
      escapeCsvField(company.contactEmail),
      escapeCsvField(company.contactPhone),
      escapeCsvField(company.contactPerson),
      translateStatus(company.status),
      company.contractedQuantity.toString(),
      company.activeSubscribers.toString(),
      formatCurrency(company.monthlyValue),
      formatDate(company.createdAt),
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="empresas-${formatDateForFilename(new Date())}.csv"`,
      },
    });
  } catch (error) {
    logError(error, 'Erro ao exportar empresas');
    return NextResponse.json({ error: 'Erro ao exportar empresas.' }, { status: 500 });
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    cancelled: 'Cancelado',
  };
  return statusMap[status] || status;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}
